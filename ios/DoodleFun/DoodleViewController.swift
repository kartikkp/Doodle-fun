import AVFoundation
import UIKit
import WebKit

private final class WeakMessageHandler: NSObject, WKScriptMessageHandler {
    weak var owner: DoodleViewController?
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        owner?.receive(message)
    }
}

/// Native UI: web content cannot supply or approve the answer. Each instance
/// authorizes exactly the operation retained by its presenting controller.
final class ParentGateViewController: UIViewController, UIAdaptivePresentationControllerDelegate {
    private(set) var challenge = NativeBridgePolicy.ParentChallenge()
    let answerField = UITextField()
    let continueButton = UIButton(type: .system)
    let cancelButton = UIButton(type: .system)
    private let errorLabel = UILabel()
    private var challengeLabel: UILabel?
    private let purpose: String
    private var decided = false
    var onDecision: ((Bool) -> Void)?

    init(purpose: String) {
        self.purpose = purpose
        super.init(nibName: nil, bundle: nil)
        modalPresentationStyle = .formSheet
        preferredContentSize = CGSize(width: 440, height: 440)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        view.accessibilityIdentifier = "DoodleParentGate"
        let scroll = UIScrollView()
        scroll.accessibilityIdentifier = "DoodleParentScroll"
        scroll.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(scroll)
        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 18
        stack.translatesAutoresizingMaskIntoConstraints = false
        scroll.addSubview(stack)
        func label(_ text: String, style: UIFont.TextStyle) -> UILabel {
            let label = UILabel()
            label.text = text
            label.font = .preferredFont(forTextStyle: style)
            label.adjustsFontForContentSizeCategory = true
            label.numberOfLines = 0
            return label
        }
        let title = label("Ask a grown-up", style: .title2)
        title.accessibilityTraits.insert(.header)
        stack.addArrangedSubview(title)
        stack.addArrangedSubview(label(purpose, style: .body))
        let prompt = label(challenge.prompt, style: .headline)
        challengeLabel = prompt
        prompt.accessibilityIdentifier = "DoodleParentChallenge"
        stack.addArrangedSubview(prompt)
        answerField.accessibilityIdentifier = "DoodleParentAnswer"
        answerField.accessibilityLabel = "Grown-up answer"
        answerField.placeholder = "Enter the answer"
        answerField.keyboardType = .numberPad
        answerField.borderStyle = .roundedRect
        answerField.font = .preferredFont(forTextStyle: .body)
        answerField.adjustsFontForContentSizeCategory = true
        answerField.autocorrectionType = .no
        stack.addArrangedSubview(answerField)
        errorLabel.textColor = .label
        errorLabel.font = .preferredFont(forTextStyle: .body)
        errorLabel.adjustsFontForContentSizeCategory = true
        errorLabel.numberOfLines = 0
        errorLabel.accessibilityIdentifier = "DoodleParentError"
        errorLabel.isHidden = true
        stack.addArrangedSubview(errorLabel)
        continueButton.setTitle("Continue", for: .normal)
        continueButton.accessibilityIdentifier = "DoodleParentContinue"
        continueButton.titleLabel?.font = .preferredFont(forTextStyle: .headline)
        continueButton.titleLabel?.adjustsFontForContentSizeCategory = true
        continueButton.addTarget(self, action: #selector(submit), for: .touchUpInside)
        stack.addArrangedSubview(continueButton)
        cancelButton.setTitle("Cancel", for: .normal)
        cancelButton.accessibilityIdentifier = "DoodleParentCancel"
        cancelButton.titleLabel?.font = .preferredFont(forTextStyle: .body)
        cancelButton.titleLabel?.adjustsFontForContentSizeCategory = true
        cancelButton.addTarget(self, action: #selector(cancel), for: .touchUpInside)
        stack.addArrangedSubview(cancelButton)
        NSLayoutConstraint.activate([
            scroll.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scroll.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            scroll.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor),
            scroll.bottomAnchor.constraint(equalTo: view.keyboardLayoutGuide.topAnchor),
            stack.topAnchor.constraint(equalTo: scroll.contentLayoutGuide.topAnchor, constant: 24),
            stack.leadingAnchor.constraint(equalTo: scroll.contentLayoutGuide.leadingAnchor, constant: 24),
            stack.trailingAnchor.constraint(equalTo: scroll.contentLayoutGuide.trailingAnchor, constant: -24),
            stack.bottomAnchor.constraint(equalTo: scroll.contentLayoutGuide.bottomAnchor, constant: -24),
            stack.widthAnchor.constraint(equalTo: scroll.frameLayoutGuide.widthAnchor, constant: -48),
            answerField.heightAnchor.constraint(greaterThanOrEqualToConstant: 48),
            continueButton.heightAnchor.constraint(greaterThanOrEqualToConstant: 48),
            cancelButton.heightAnchor.constraint(greaterThanOrEqualToConstant: 48)
        ])
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        presentationController?.delegate = self
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        decide(false)
    }

    func presentationControllerDidDismiss(_ presentationController: UIPresentationController) { decide(false) }

    @objc private func submit() {
        guard !decided else { return }
        guard challenge.accepts(answerField.text ?? "") else {
            challenge = NativeBridgePolicy.ParentChallenge()
            challengeLabel?.text = challenge.prompt
            answerField.text = ""
            errorLabel.text = "That answer doesn’t match. Please try again, or choose Cancel."
            errorLabel.isHidden = false
            UIAccessibility.post(notification: .announcement, argument: errorLabel.text)
            return
        }
        decide(true)
    }

    @objc private func cancel() { decide(false) }

    private func decide(_ approved: Bool) {
        guard !decided else { return }
        decided = true
        view.endEditing(true)
        onDecision?(approved)
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
    private enum ParentAction {
        case share(NativeBridgePolicy.ShareImage)
        case external(URL)

        var purpose: String {
            switch self {
            case .share: return "A grown-up can approve sharing this drawing with another app."
            case .external(let url): return "A grown-up can approve opening this website in your browser:\n\(url.absoluteString)"
            }
        }
    }
    private var pendingParentAction: (id: UUID, action: ParentAction)?
    private var parentGate: ParentGateViewController?
    private var openingExternalURL = false
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
        // Keep scrolling activity content from showing behind the status bar.
        let statusBarBackground = UIView()
        statusBarBackground.backgroundColor = view.backgroundColor
        statusBarBackground.isOpaque = true
        statusBarBackground.isUserInteractionEnabled = false
        statusBarBackground.isAccessibilityElement = false
        statusBarBackground.accessibilityElementsHidden = true
        statusBarBackground.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(statusBarBackground)
        NSLayoutConstraint.activate([
            statusBarBackground.topAnchor.constraint(equalTo: view.topAnchor),
            statusBarBackground.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            statusBarBackground.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            statusBarBackground.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
        setupStatus()
        backgroundObserver = NotificationCenter.default.addObserver(forName: UIApplication.willResignActiveNotification, object: nil, queue: .main) { [weak self] _ in
            self?.speaker.stopSpeaking(at: .immediate)
            self?.cancelParentAction()
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
        cancelParentAction()
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
            if let hash = NativeBridgePolicy.route(body["hash"]) {
                if hash != currentHash { cancelParentAction() }
                currentHash = hash
            }
        case "shareImage":
            guard canRequestParentAction else { return }
            guard let image = NativeBridgePolicy.shareImage(body) else { shareResult("failed"); return }
            requestParentAction(.share(image))
        case "openExternalURL":
            guard canRequestParentAction else { return }
            guard let url = NativeBridgePolicy.externalURL(body["url"]) else { externalResult("failed"); return }
            requestParentAction(.external(url))
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

    private var canRequestParentAction: Bool {
        pendingParentAction == nil && presentedViewController == nil && shareDirectory == nil &&
            !openingExternalURL && UIApplication.shared.applicationState == .active
    }

    private func requestParentAction(_ action: ParentAction) {
        guard canRequestParentAction else { return }
        let id = UUID()
        let gate = ParentGateViewController(purpose: action.purpose)
        pendingParentAction = (id, action)
        parentGate = gate
        speaker.stopSpeaking(at: .immediate)
        gate.onDecision = { [weak self, weak gate] approved in
            guard let self, let gate, self.pendingParentAction?.id == id else { return }
            guard approved, UIApplication.shared.applicationState == .active else { self.cancelParentAction(); return }
            // Keep the exact payload pending until dismissal ends. Backgrounding
            // during this transition invalidates it before either operation runs.
            gate.dismiss(animated: true) { [weak self] in
                guard let self, let pending = self.pendingParentAction, pending.id == id else { return }
                guard UIApplication.shared.applicationState == .active else { self.cancelParentAction(); return }
                self.pendingParentAction = nil
                self.parentGate = nil
                switch pending.action {
                case .share(let image): self.shareApprovedImage(image)
                case .external(let url):
                    self.openingExternalURL = true
                    UIApplication.shared.open(url, options: [:]) { [weak self] opened in
                        self?.openingExternalURL = false
                        self?.externalResult(opened ? "completed" : "failed")
                    }
                }
            }
        }
        present(gate, animated: true)
    }

    private func cancelParentAction() {
        guard let pending = pendingParentAction else { return }
        pendingParentAction = nil
        let gate = parentGate
        parentGate = nil
        gate?.dismiss(animated: false)
        switch pending.action {
        case .share: shareResult("cancelled")
        case .external: externalResult("cancelled")
        }
    }

    private func shareApprovedImage(_ image: NativeBridgePolicy.ShareImage) {
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

    private func externalResult(_ status: String) {
        webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('doodle-native-external',{detail:{status:'\(status)'}}))", completionHandler: nil)
    }
}
