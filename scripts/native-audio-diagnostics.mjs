import {mkdir, readdir, readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {homedir} from 'node:os';
import {fileURLToPath} from 'node:url';

const sha = value => createHash('sha256').update(value).digest('hex');
const validDirectory = value => /^doodle-audio-qa-[a-f0-9]{32}$/.test(value);

/** Instrument only the runner's copied controller; source anchors fail closed. */
export function instrumentNativeAudioController(original, observer, traceDirectory) {
  if (!validDirectory(traceDirectory)) throw new Error('Invalid QA audio trace directory');
  let source = original;
  const replace = (anchor, replacement) => {
    if (source.split(anchor).length !== 2) throw new Error(`Audio diagnostics anchor changed: ${anchor.slice(0, 100)}`);
    source = source.replace(anchor, () => replacement);
  };
  const declaration = 'final class DoodleViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {';
  replace(declaration, `
#if DEBUG
private enum DoodleQAAudioTrace {
    static let directory = FileManager.default.temporaryDirectory.appendingPathComponent("${traceDirectory}")
    static let url = directory.appendingPathComponent(UUID().uuidString + ".jsonl")
    static var count = 0
    static func start() {
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        // Bound both each launch and the number of retained launches.
        guard ((try? FileManager.default.contentsOfDirectory(atPath: directory.path).count) ?? 32) < 32 else { return }
        try? Data().write(to: url)
    }
    static func record(_ value: [String: Any]) {
        guard count < 600 else { return }
        count += 1
        var entry = value
        entry["receivedAt"] = Date().timeIntervalSince1970
        guard var data = try? JSONSerialization.data(withJSONObject: entry, options: [.sortedKeys]),
              data.count < 4096, let handle = try? FileHandle(forWritingTo: url) else { return }
        data.append(10)
        defer { try? handle.close() }
        do { try handle.seekToEnd(); try handle.write(contentsOf: data) } catch {}
    }
}
private final class DoodleQAAudioTraceHandler: NSObject, WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let value = message.body as? [String: Any] else { return }
        DoodleQAAudioTrace.record(value)
    }
}
#endif
${declaration}`);
  const configuration = '        let configuration = WKWebViewConfiguration()';
  replace(configuration, `${configuration}
        #if DEBUG
        DoodleQAAudioTrace.start()
        configuration.userContentController.add(DoodleQAAudioTraceHandler(), name: "doodleQASpeech")
        let qaObserver = String(data: Data(base64Encoded: "${Buffer.from(observer).toString('base64')}")!, encoding: .utf8)!
        configuration.userContentController.addUserScript(WKUserScript(source: qaObserver, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        #endif`);
  const category = '        if session.category != .playback || session.mode != .default || session.categoryOptions != [.mixWithOthers] {';
  replace(category, `        #if DEBUG
        DoodleQAAudioTrace.record(["event": "native-category-check", "category": session.category.rawValue, "mode": session.mode.rawValue,
                                  "willChange": session.category != .playback || session.mode != .default || session.categoryOptions != [.mixWithOthers]])
        #endif
${category}`);
  const changed = '            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])';
  replace(changed, `${changed}
            #if DEBUG
            DoodleQAAudioTrace.record(["event": "native-category-changed", "category": session.category.rawValue, "mode": session.mode.rawValue])
            #endif`);
  const prepare = '    fileprivate func prepareGameAudio(_ message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void) {';
  replace(prepare, `${prepare}
        #if DEBUG
        DoodleQAAudioTrace.record(["event": "native-prepare-received", "active": UIApplication.shared.applicationState == .active, "pendingPause": pendingListeningPause])
        // Forward the original values to the original callback exactly once.
        let originalReply = replyHandler
        let replyHandler: (Any?, String?) -> Void = { value, error in
            let result = value as? [String: Any]
            DoodleQAAudioTrace.record(["event": "native-prepare-reply", "ok": result?["ok"] as? Bool ?? false,
                                      "reason": result?["reason"] as? String ?? "", "hasError": error != nil])
            originalReply(value, error)
        }
        #endif`);
  const active = '            try session.setActive(true)';
  replace(active, `            #if DEBUG
            DoodleQAAudioTrace.record(["event": "native-activation-begin"])
            #endif
${active}
            #if DEBUG
            DoodleQAAudioTrace.record(["event": "native-activation-end"])
            #endif`);
  return {source, metadata: {
    traceDirectory, observerSHA256: sha(observer), originalControllerSHA256: sha(original),
    instrumentedControllerSHA256: sha(source), maxEventsPerLaunch: 600, maxLaunches: 32,
  }};
}

/** Read only this run's generated directory, including when XCTest shuts down its simulator. */
export async function collectNativeAudioDiagnostics({applicationsDirectory, traceDirectory, output}) {
  if (!validDirectory(traceDirectory)) throw new Error('Invalid QA audio trace directory');
  const destination = path.join(output, 'audio-diagnostics');
  await mkdir(destination, {recursive:true});
  const files = [];
  const containers = await readdir(applicationsDirectory, {withFileTypes:true});
  for (const container of containers.filter(item => item.isDirectory())) {
    const directory = path.join(applicationsDirectory, container.name, 'tmp', traceDirectory);
    let entries;
    try { entries = await readdir(directory, {withFileTypes:true}); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    for (const entry of entries.filter(item => item.isFile() && /^[A-Fa-f0-9-]{36}\.jsonl$/.test(item.name))) {
      if (files.length >= 32) throw new Error('Audio diagnostic launch limit exceeded');
      const bytes = await readFile(path.join(directory, entry.name));
      if (bytes.length > 600 * 4096) throw new Error('Audio diagnostic size limit exceeded');
      const records = bytes.toString('utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
      if (records.length > 600) throw new Error('Audio diagnostic event limit exceeded');
      await writeFile(path.join(destination, entry.name), bytes);
      files.push({name:entry.name, events:records.length, bytes:bytes.length, sha256:sha(bytes)});
    }
  }
  const metadata = {traceDirectory, files};
  await writeFile(path.join(output, 'audio-diagnostics.json'), JSON.stringify(metadata, null, 2) + '\n');
  return metadata;
}

// A separate always-run workflow step also exports traces after a test timeout
// interrupts the runner before its normal collection. No test is repeated.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] !== '--collect' || !process.argv[3]) throw new Error('Use --collect <QA output directory>');
  const output = path.resolve(process.argv[3]);
  let metadata;
  try { metadata = JSON.parse(await readFile(path.join(output, 'qa-build.json'), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (metadata?.audioDiagnostics) {
    if (!/^[a-f0-9-]{36}$/i.test(metadata.device)) throw new Error('Invalid diagnostic simulator identifier');
    const result = await collectNativeAudioDiagnostics({
      applicationsDirectory:path.join(homedir(), 'Library/Developer/CoreSimulator/Devices', metadata.device, 'data/Containers/Data/Application'),
      traceDirectory:metadata.audioDiagnostics.traceDirectory, output,
    });
    console.log(`Retained ${result.files.length} bounded audio diagnostic launch trace(s).`);
  }
}
