1. Xcode Console (Real-time logs)

⏺ Bash(open -a Xcode)…
  ⎿  (No content)

⏺ In Xcode:
  1. Go to Window → Devices and Simulators
  2. Select your connected iPhone
  3. Click Open Console button
  4. Launch your TestFlight app - you'll see real-time logs

  2. Console.app (macOS built-in)

⏺ Bash(open -a Console)…
  ⎿  (No content)

⏺ In Console.app:
  1. Select your iPhone from the sidebar
  2. Filter by your app name: com.grumpylemon.familyfun
  3. Launch the app to see crash logs

  3. Export Crash Reports from iPhone

  On your iPhone:
  1. Settings → Privacy & Security → Analytics & Improvements → Analytics Data
  2. Look for crashes starting with your app name
  3. Tap the crash → Share → AirDrop to your Mac

  4. Sentry Dashboard (if configured)

  Check your Sentry dashboard at sentry.io - crashes should appear there automatically
  since you have Sentry integrated.

  Best approach: Use Xcode's Device Console for real-time logs while reproducing the
  crash. This gives the most detailed information about what's happening during the crash.