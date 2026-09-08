import SwiftUI

@main
struct DoodleFunApp: App {
    var body: some Scene {
        WindowGroup {
            DoodleContentView()
                .ignoresSafeArea()
                .preferredColorScheme(.light)
        }
    }
}

private struct DoodleContentView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> DoodleViewController { DoodleViewController() }
    func updateUIViewController(_ controller: DoodleViewController, context: Context) {}
}
