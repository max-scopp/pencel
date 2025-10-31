# WSL2 Setup for Vite Development

## Problem
You're running on WSL2 and experiencing `ENOSPC: System limit for number of file watchers reached` errors.

## Solution

### Step 1: Update WSL Configuration
You need to add a `.wslconfig` file in your Windows home directory to increase inotify limits.

**Location**: `C:\Users\{YourUsername}\.wslconfig`

**Content**:
```ini
[interop]
enabled=true
appendWindowsPath=true

[wsl2]
memory=8GB
processors=4
localhostForwarding=true
```

### Step 2: Create wsl.conf in Linux (Already Applied)
This persists the inotify settings across WSL2 restarts:

```bash
sudo sh -c 'cat > /etc/wsl.conf << EOF
[interop]
enabled = true
appendWindowsPath = true

[boot]
systemd=true
EOF'
```

Already created at: `/etc/sysctl.d/99-vite.conf`

### Step 3: Restart WSL2
After creating/updating `.wslconfig`:

**From Windows PowerShell (Admin)**:
```powershell
wsl --shutdown
wsl -d Ubuntu-24.04  # or your distro name
```

Then return to your WSL terminal:
```bash
cd /home/mscopp/pencil
```

### Step 4: Verify Limits Are Applied
```bash
cat /proc/sys/fs/inotify/max_user_watches
cat /proc/sys/fs/inotify/max_user_instances
```

Should show:
```
524288
16384
```

### Step 5: Start Vite Dev Server
```bash
cd examples/sample/web
bun vite --host
```

## Why This Happens

WSL2 has a default limit of `8192` for `max_user_watches`, which is too low for large monorepos with many files. The fix increases it to `524288`, which is sufficient for development.

## Permanent Fix
Once you restart WSL with the updated configuration, the settings will persist. You only need to do this once.

## If It Still Doesn't Work

Check your current WSL2 instance name:
```bash
wsl -l -v
```

Then shutdown and restart:
```powershell
wsl --shutdown
# Wait a few seconds
wsl
```

## Additional Resources
- [WSL Configuration Reference](https://learn.microsoft.com/en-us/windows/wsl/wsl-config)
- [Vite File Watching Guide](https://vitejs.dev/guide/cli.html)
