# Windows setup

How to get this project running on a Windows laptop: clone it, connect to Supabase, run it on an Android phone, and continue with Claude Code.

## 1. Install the tools

Run these in PowerShell. `winget` ships with Windows 10/11.

```powershell
winget install Git.Git
winget install OpenJS.NodeJS.LTS
winget install Microsoft.OpenJDK.21
winget install Google.AndroidStudio
```

Supabase CLI: its npm global install isn't supported, so use Scoop:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Close and reopen the terminal, then check:

```powershell
git --version
node --version
java -version
supabase --version
```

## 2. Enable long paths

React Native's native build creates very deep paths. Windows' 260-character limit breaks it with confusing CMake/Gradle errors. Fix it once, in an **admin** PowerShell:

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
git config --global core.longpaths true
```

Also clone into a short path such as `C:\dev`, not somewhere under `Documents` or `OneDrive`. OneDrive syncing `node_modules` is slow and causes file-lock errors.

## 3. GitHub access (SSH)

The repo is private and the remote uses SSH.

```powershell
ssh-keygen -t ed25519 -C "your-email"
Get-Content $HOME\.ssh\id_ed25519.pub | Set-Clipboard
```

Paste the key at GitHub → Settings → SSH and GPG keys → New SSH key. Then test:

```powershell
ssh -T git@github.com
```

## 4. Clone and install

```powershell
mkdir C:\dev
cd C:\dev
git clone git@github.com:mark-leon/calory-ai.git
cd calory-ai
npm install
```

## 5. Connect Supabase

```powershell
supabase login
supabase link --project-ref ktmyxanpdbouxdyhjozt
```

`login` opens a browser to approve. `link` may ask for the database password; it's in the Supabase dashboard under Project Settings → Database (reset it there if you don't have it).

The schema and food data are already in the cloud project, so there's nothing to push. Only run `supabase db push` after adding a new file to `supabase/migrations/`.

## 6. Android SDK

1. Open Android Studio once and finish the setup wizard (it installs the SDK).
2. In **More Actions → SDK Manager**:
   - SDK Platforms: Android 16 (API 36)
   - SDK Tools: Android SDK Build-Tools 36, NDK (Side by side), CMake, Android SDK Platform-Tools
3. Set environment variables (PowerShell, then reopen the terminal):

```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
$p = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$p;$env:LOCALAPPDATA\Android\Sdk\platform-tools", "User")
```

Check with `adb --version`.

## 7. Run on the phone

1. On the phone: Settings → About phone → tap **Build number** 7 times, then Developer options → turn on **USB debugging**.
2. Plug in by USB and accept the "Allow USB debugging" prompt on the phone.
3. Check that it's detected:

```powershell
adb devices
```

It should list the device as `device`. If it shows `unauthorized`, accept the prompt on the phone. If nothing shows, install the Google USB Driver from SDK Manager → SDK Tools, or your phone maker's USB driver.

4. Build and install:

```powershell
npx expo prebuild -p android
npx expo run:android
```

The first build takes 10–20 minutes (Gradle downloads, native C++ compile). Later builds are much faster. `android/` is generated and gitignored, so rerun `prebuild` whenever you add a native package or change `app.json`.

To skip the local Android toolchain completely, build in the cloud instead: `npm install -g eas-cli`, `eas login`, `eas build -p android --profile development`.

## 8. Continue with Claude Code

Claude Code on Windows needs Git Bash, which comes with Git for Windows (step 1).

```powershell
npm install -g @anthropic-ai/claude-code
cd C:\dev\calory-ai
claude
```

Chat history from the other laptop doesn't transfer; sessions are stored per machine. Project context lives in `AGENTS.md`, which Claude Code loads automatically through `CLAUDE.md`. Start with something like:

> Read AGENTS.md and continue with the next steps.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Filename longer than 260 characters` / CMake path errors | Step 2, and make sure the repo is under a short path like `C:\dev` |
| `SDK location not found` | `ANDROID_HOME` isn't set, or the terminal wasn't reopened after setting it |
| `adb` not recognized | `platform-tools` isn't on `Path` (step 6) |
| Build fails with `EPERM` / file locked | Repo is inside OneDrive, or antivirus is scanning `node_modules`. Move to `C:\dev`, add a Defender exclusion for it |
| `Port 8081 is in use` | Another Metro is running. Close it or run `npx expo start --port 8082` |
| Phone can't reach Metro | `adb reverse tcp:8081 tcp:8081` |
| Supabase `auth_query secret check timed out` | Transient pooler error. Retry the command |
