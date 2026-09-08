import AVFoundation
import UIKit
import WebKit

private final class WeakMessageHandler: NSObject, WKScriptMessageHandler {
    weak var owner: DoodleViewController?
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        owner?.receive(message)
    }
}

final class DoodleViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private(set) var webView: WKWebView!
    private(set) var currentHash = "#"
    var onContentReady: (() -> Void)?
    private let document = Bundle.main.url(forResource: "index", withExtension: "html")!
    private let speaker = AVSpeechSynthesizer()
    private let messageHandler = WeakMessageHandler()
    private let status = UIStackView()
    private let statusLabel = UILabel()
    private let retryButton = UIButton(type: .system)
    private var shareDirectory: URL?
    private var recovering = false
    private var contentRulesReady = false
    private var recoveryTimes: [Date] = []
    private var backgroundObserver: NSObjectProtocol?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.97, green: 0.98, blue: 1, alpha: 1)
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        messageHandler.owner = self
        configuration.userContentController.add(messageHandler, name: "doodleNative")
        configuration.userContentController.addUserScript(WKUserScript(source: """
            (() => {
              const report = () => window.webkit.messageHandlers.doodleNative.postMessage({type:'route',hash:location.hash || '#'});
              addEventListener('hashchange', report); report();
            })();
            """, injectionTime: .atDocumentEnd, forMainFrameOnly: true))
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = view.backgroundColor
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor), webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor), webView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
        setupStatus()
        backgroundObserver = NotificationCenter.default.addObserver(forName: UIApplication.willResignActiveNotification, object: nil, queue: .main) { [weak self] _ in
            self?.speaker.stopSpeaking(at: .immediate)
        }
        prepareDocument()
    }

    private func prepareDocument() {
        // The packaged app needs no remote scripts, media, sockets, or requests.
        let rules = #"[{"trigger":{"url-filter":"^https?://"},"action":{"type":"block"}},{"trigger":{"url-filter":"^wss?://"},"action":{"type":"block"}}]"#
        WKContentRuleListStore.default().compileContentRuleList(forIdentifier: "DoodleOfflineOnly", encodedContentRuleList: rules) { [weak self] rules, error in
            guard let self else { return }
            guard let rules, error == nil else { self.showError(); return }
            self.webView.configuration.userContentController.add(rules)
            self.contentRulesReady = true
            #if DEBUG
            if ProcessInfo.processInfo.arguments.contains("--reset-test-data") {
                self.webView.configuration.websiteDataStore.removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(), modifiedSince: .distantPast) { [weak self] in self?.loadDocument() }
                return
            }
            #endif
            self.loadDocument()
        }
    }

    deinit {
        if let backgroundObserver { NotificationCenter.default.removeObserver(backgroundObserver) }
        if let shareDirectory { try? FileManager.default.removeItem(at: shareDirectory) }
    }

    private func setupStatus() {
        status.axis = .vertical
        status.spacing = 20
        status.alignment = .center
        status.backgroundColor = view.backgroundColor
        status.isLayoutMarginsRelativeArrangement = true
        status.directionalLayoutMargins = NSDirectionalEdgeInsets(top: 28, leading: 24, bottom: 28, trailing: 24)
        status.layer.cornerRadius = 20
        statusLabel.text = "Opening Doodle Fun…"
        statusLabel.font = .preferredFont(forTextStyle: .headline)
        statusLabel.adjustsFontForContentSizeCategory = true
        statusLabel.numberOfLines = 0
        statusLabel.textAlignment = .center
        retryButton.setTitle("Try again", for: .normal)
        retryButton.titleLabel?.font = .preferredFont(forTextStyle: .headline)
        retryButton.addTarget(self, action: #selector(retry), for: .touchUpInside)
        retryButton.heightAnchor.constraint(greaterThanOrEqualToConstant: 48).isActive = true
        retryButton.isHidden = true
        status.addArrangedSubview(statusLabel)
        status.addArrangedSubview(retryButton)
        status.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(status)
        NSLayoutConstraint.activate([
            status.centerXAnchor.constraint(equalTo: view.centerXAnchor), status.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            status.widthAnchor.constraint(lessThanOrEqualTo: view.safeAreaLayoutGuide.widthAnchor, constant: -40)
        ])
    }

    @objc private func retry() {
        recoveryTimes.removeAll()
        if contentRulesReady { loadDocument() } else { prepareDocument() }
    }

    private func loadDocument() {
        guard contentRulesReady else { showError(); return }
        statusLabel.text = recovering ? "Opening your activity…" : "Opening Doodle Fun…"
        status.isHidden = false
        retryButton.isHidden = true
        var components = URLComponents(url: document, resolvingAgainstBaseURL: false)!
        components.fragment = String(currentHash.dropFirst())
        webView.loadFileURL(components.url!, allowingReadAccessTo: document)
    }

    private func showError() {
        statusLabel.text = "Let’s open your activity again."
        retryButton.isHidden = false
        status.isHidden = false
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        decisionHandler(NativeBridgePolicy.allows(navigationAction.request.url, document: document) && navigationAction.targetFrame?.isMainFrame == true ? .allow : .cancel)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? { nil }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        recovering = false
        status.isHidden = true
        onContentReady?()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { showError() }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if (error as NSError).code != NSURLErrorCancelled { showError() }
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        speaker.stopSpeaking(at: .immediate)
        recoveryTimes = recoveryTimes.filter { Date().timeIntervalSince($0) < 30 }
        guard recoveryTimes.count < 2 else { showError(); return }
        recoveryTimes.append(Date())
        recovering = true
        loadDocument()
    }

    fileprivate func receive(_ message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, NativeBridgePolicy.allows(message.frameInfo.request.url, document: document),
              let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        switch type {
        case "route":
            if let hash = NativeBridgePolicy.route(body["hash"]) { currentHash = hash }
        case "shareImage": share(body)
        case "speak":
            guard let text = body["text"] as? String, !text.isEmpty, text.count <= 4000 else { return }
            speaker.stopSpeaking(at: .immediate)
            let utterance = AVSpeechUtterance(string: text)
            utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
            utterance.rate = 0.43
            speaker.speak(utterance)
        case "stopSpeaking": speaker.stopSpeaking(at: .immediate)
        default: break
        }
    }

    private func share(_ body: [String: Any]) {
        guard presentedViewController == nil, shareDirectory == nil else { return }
        guard let image = NativeBridgePolicy.shareImage(body) else { shareResult("failed"); return }
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent("DoodleShare-\(UUID().uuidString)", isDirectory: true)
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: false)
            let file = directory.appendingPathComponent(image.filename)
            try image.png.write(to: file, options: .atomic)
            shareDirectory = directory
            speaker.stopSpeaking(at: .immediate)
            let sheet = UIActivityViewController(activityItems: [file], applicationActivities: nil)
            sheet.view.accessibilityIdentifier = "DoodleShareSheet"
            sheet.popoverPresentationController?.sourceView = view
            sheet.popoverPresentationController?.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
            sheet.popoverPresentationController?.permittedArrowDirections = []
            sheet.completionWithItemsHandler = { [weak self] _, completed, _, error in
                try? FileManager.default.removeItem(at: directory)
                self?.shareDirectory = nil
                self?.shareResult(error == nil ? (completed ? "completed" : "cancelled") : "failed")
            }
            present(sheet, animated: true)
        } catch {
            try? FileManager.default.removeItem(at: directory)
            shareDirectory = nil
            shareResult("failed")
        }
    }

    private func shareResult(_ status: String) {
        // Status is native-owned, never interpolated from web content.
        webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('doodle-native-share',{detail:{status:'\(status)'}}))", completionHandler: nil)
    }
}
