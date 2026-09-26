# System volume follow-up

Implemented in `709d09e` and `f28dc5e`. Game mute/volume UI and preference gates are removed; old saved muted/low values are ignored. The shared fixed output and stronger 0.16-second drum produce substantially stronger digital sound with a bounded waveform. Read aloud remains optional spoken help. Offline/native bundle runtime is `38dd5ac3d8d348ae`.

Verification: 95 unit, 122 live/controller browser and 10 offline signal tests passed, with no failures/skips/flaky results. Ten phone/tablet views passed visual/touch/legacy-preference checks. Native trusted test code compiled. Native runtime execution and physical listening remain unverified; the Mac is locked. Hosted CI is in progress on source `f28dc5e` (run 36280837350).

Build 3 archive is built and signature/content verified. Distribution export failed with No Accounts/no iOS Distribution certificate. No upload or group assignment for build 3 occurred. Unlock the Mac, verify Xcode signing availability and native checks, retry export/audit, upload and assign the existing authorized groups. Do not replace historical build-2/CI results with claims about this candidate. Owner signing project remains unchanged.
