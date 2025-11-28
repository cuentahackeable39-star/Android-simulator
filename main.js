document.addEventListener('DOMContentLoaded', () => {
  // Splash Screen removal logic
  const splashScreen = document.getElementById('splashScreen');
  if (splashScreen) {
    // Allow the user to dismiss the splash screen by clicking on it
    splashScreen.addEventListener('click', () => {
      splashScreen.classList.add('hidden');
      setTimeout(() => {
        splashScreen.remove();
      }, 1000);
    });
    // Automatically hide the splash screen after 3 seconds
    setTimeout(() => {
      splashScreen.classList.add('hidden');
      setTimeout(() => {
        splashScreen.remove();
      }, 1000);
    }, 3000);
  }

  // Track bootloader + OS state
  let bootloaderUnlocked = false;
  let currentOS = localStorage.getItem('currentOS') || "Android";
  let twrpInstalled = (localStorage.getItem('twrpInstalled') === 'true') || false;

  // Simple toast helper (added to fix ReferenceError: showToast is not defined)
  function showToast(text, duration = 2000) {
    try {
      const container = document.getElementById('toastContainer') || (() => {
        const c = document.createElement('div');
        c.id = 'toastContainer';
        c.style.position = 'fixed';
        c.style.bottom = '30px';
        c.style.left = '50%';
        c.style.transform = 'translateX(-50%)';
        c.style.zIndex = '10000';
        document.body.appendChild(c);
        return c;
      })();

      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = text || '';
      toast.style.pointerEvents = 'auto';
      container.appendChild(toast);

      // remove after duration + fadeout time
      const total = (duration || 2000) + 1000;
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
          toast.remove();
        }, 500);
      }, duration || 2000);
    } catch (e) {
      // fail silently if toast can't render
      console.log('Toast:', text);
    }
  }

  // Bootloader unlocking logic
  const bootloaderOverlay = document.getElementById('bootloaderOverlay');
  if (bootloaderOverlay) {
    bootloaderOverlay.addEventListener('click', function() {
      this.style.animation = "fadeOutBootloader 0.5s forwards";
      setTimeout(() => {
        this.remove();
        bootloaderUnlocked = true;
        showToast("Bootloader unlocked! Custom OS install available.");
        showCustomOsPrompt();
      }, 500);
    });
  }

  function showCustomOsPrompt() {
    const device = document.querySelector('.device');
    if (!device || !bootloaderUnlocked) return;

    // Avoid duplicates
    if (document.getElementById('customOsOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'customOsOverlay';
    overlay.innerHTML = `
      <div class="custom-os-dialog">
        <h3>Bootloader Unlocked</h3>
        <p>Select what to do with your device:</p>
        <button id="keepAndroidButton">Keep Android 1.0 Sim</button>
        <button id="installTwrpButton">Install Team Win Recovery Project (TWRP)</button>
      </div>
    `;
    device.appendChild(overlay);

    overlay.querySelector('#keepAndroidButton').addEventListener('click', () => {
      showToast("Keeping Android 1.0 Sim.");
      overlay.remove();
    });

    overlay.querySelector('#installTwrpButton').addEventListener('click', () => {
      overlay.remove();
      installTwrp();
    });
  }

  function installTwrp() {
    const device = document.querySelector('.device');
    if (!device || !bootloaderUnlocked) {
      showToast("Bootloader must be unlocked to install TWRP.");
      return;
    }

    // Prevent duplicate installer
    if (document.getElementById('laptopInstallerOverlay')) return;

    // Shift the phone so the laptop has space
    device.classList.add('shift-right');

    // Small delay to let transform complete so laptop doesn't overlap
    setTimeout(() => {
      // Create laptop installer element
      const laptop = document.createElement('div');
      laptop.id = 'laptopInstallerOverlay';
      laptop.className = 'laptop-installer shifted';
      laptop.innerHTML = `
        <div class="laptop-screen">
          <div class="laptop-header">Laptop Installer</div>
          <div id="laptopStatus" class="laptop-status">Status: Waiting for connection...</div>
          <div class="laptop-controls">
            <button id="connectLaptopBtn" class="laptop-btn primary">Connect Laptop</button>
            <button id="startLaptopInstallBtn" class="laptop-btn" disabled>Start Install</button>
          </div>
          <button id="cancelLaptopInstall" class="laptop-cancel">Cancel</button>
        </div>
      `;

      // Insert laptop before the device so it visually appears to the left
      document.body.insertBefore(laptop, device);

      // Query the newly-created controls
      const laptopStatusElem = laptop.querySelector('#laptopStatus');
      const connectBtn = laptop.querySelector('#connectLaptopBtn');
      const startBtn = laptop.querySelector('#startLaptopInstallBtn');
      const cancelBtn = laptop.querySelector('#cancelLaptopInstall');

      let laptopConnected = false;

      connectBtn.addEventListener('click', () => {
        if (laptopConnected) {
          laptopStatusElem.textContent = 'Status: Laptop already connected.';
          return;
        }
        laptopConnected = true;
        laptopStatusElem.textContent = 'Status: Laptop detected. Handshake complete. Ready to start flashing TWRP.';
        connectBtn.disabled = true;
        startBtn.disabled = false;
        showToast('Laptop connected. Start the install from the laptop UI (simulated).');
      });

      startBtn.addEventListener('click', () => {
        if (!laptopConnected) {
          showToast('Connect a laptop first.');
          return;
        }
        startBtn.disabled = true;
        laptopStatusElem.textContent = 'Status: Starting TWRP flash...';

        const phoneScreen = document.querySelector('.screen');
        if (phoneScreen) {
          // show an image overlay on the phone to simulate transfer/notice
          const imageOverlay = document.createElement('div');
          imageOverlay.id = 'phoneInstallImage';
          imageOverlay.style.position = 'absolute';
          imageOverlay.style.top = '24px';
          imageOverlay.style.left = '0';
          imageOverlay.style.right = '0';
          imageOverlay.style.bottom = '0';
          imageOverlay.style.background = '#000';
          imageOverlay.style.display = 'flex';
          imageOverlay.style.alignItems = 'center';
          imageOverlay.style.justifyContent = 'center';
          imageOverlay.style.zIndex = '210';
          imageOverlay.style.padding = '12px';
          imageOverlay.style.boxSizing = 'border-box';
          imageOverlay.innerHTML = `
            <div style="max-width:86%;max-height:70%;display:flex;flex-direction:column;align-items:center;gap:8px;">
              <img id="installPreviewImg" src="https://android.stackexchange.com/content/legacy-uploads/2016/07/galaxy-s-4-custom-os-830x467.png" alt="Install preview" style="max-width:100%;max-height:100%;border-radius:6px;box-shadow:0 6px 20px rgba(0,0,0,0.6);" />
              <div style="color:#9ff7f0;font-family: 'Courier New', monospace;font-size:0.85em;text-align:center;">Installer: flashing TWRP to device...</div>
            </div>
          `;
          phoneScreen.appendChild(imageOverlay);
          showToast('Laptop: sending TWRP image to device (simulated).');

          // after 5s remove image overlay and continue to TWRP boot
          setTimeout(() => {
            const imgOv = document.getElementById('phoneInstallImage');
            if (imgOv) imgOv.remove();

            // cleanup laptop UI
            const lap = document.getElementById('laptopInstallerOverlay');
            if (lap) lap.remove();

            // mark installed and persist
            twrpInstalled = true;
            try { localStorage.setItem('twrpInstalled', 'true'); } catch(e){}

            showToast('Laptop: TWRP flashed successfully.');

            // revert device position and boot TWRP after a short pause
            device.classList.remove('shift-right');
            setTimeout(() => bootTwrpRecovery(), 300);
          }, 5000);
        } else {
          // fallback progress log if phone screen not found
          laptopStatusElem.textContent = 'Status: Starting TWRP flash...\n';
          const progressLines = [
            '[*] Sending TWRP image to device...',
            '[*] Writing image to recovery partition...',
            '[*] Verifying image checksum...',
            '[*] Finalizing write...'
          ];
          let p = 0;
          function laptopStep() {
            if (p < progressLines.length) {
              laptopStatusElem.textContent += progressLines[p] + '\n';
              p++;
              setTimeout(laptopStep, 800);
            } else {
              laptopStatusElem.textContent += '[+] TWRP flash complete. Rebooting to recovery...\n';
              showToast('Laptop: TWRP flashed successfully.');
              setTimeout(() => {
                const ov = document.getElementById('laptopInstallerOverlay');
                if (ov) ov.remove();
                twrpInstalled = true;
                try { localStorage.setItem('twrpInstalled', 'true'); } catch(e){}
                device.classList.remove('shift-right');
                setTimeout(() => bootTwrpRecovery(), 300);
              }, 800);
            }
          }
          laptopStep();
        }
      });

      cancelBtn.addEventListener('click', () => {
        // Cancel during install now bricks the simulated device
        brickDevice("Cancelled installation from laptop — device bricked.");
      });

    }, 360); // wait to finish device shift transition
  }

  function bootTwrpRecovery() {
    const screen = document.querySelector('.screen');
    if (!screen) return;

    // Hide Android UI
    const homeScreen = document.getElementById('homeScreen');
    const appWindow = document.getElementById('appWindow');
    if (homeScreen) homeScreen.style.display = 'none';
    if (appWindow) appWindow.classList.remove('open');

    // Remove existing recovery / linux screens
    const existingTwrp = document.getElementById('twrpRecoveryScreen');
    if (existingTwrp) existingTwrp.remove();
    const existingLinux = document.getElementById('linuxOsScreen');
    if (existingLinux) existingLinux.remove();

    const twrpScreen = document.createElement('div');
    twrpScreen.id = 'twrpRecoveryScreen';
    // Use class-based styles (moved from inline to CSS)
    twrpScreen.className = 'twrp-screen';
    twrpScreen.innerHTML = `
      <div class="twrp-header">Team Win Recovery Project (TWRP) · android-sim</div>
      <div class="twrp-log">
        <pre id="twrpLog">
TWRP 3.7.0-sim
Device: android-sim
Mounting partitions...
Data: Mounted (rw)
System: Mounted (ro)
Cache: Mounted (rw)

Use the options below to manage your device.
        </pre>
      </div>
      <div class="twrp-actions">
        <div style="display:flex;flex-direction:column;gap:8px;width:100%;max-width:520px;">
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button id="twrpWipeButton" class="twrp-btn secondary">Wipe Data</button>
            <button id="twrpFormatButton" class="twrp-btn secondary">Format Data</button>
            <button id="twrpMountButton" class="twrp-btn secondary">Mount</button>
            <button id="twrpInstallImageButton" class="twrp-btn">Install Image</button>
            <button id="twrpChooseOsButton" class="twrp-btn">Choose Custom OS</button>
            <button id="twrpRebootSystemButton" class="twrp-btn secondary">Reboot System</button>
          </div>

          <div style="margin-top:6px;padding:10px;border-radius:8px;background:linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.02));">
            <div style="font-weight:800;margin-bottom:6px;color:#ffdd57;">Warning: Wiping or formatting may result in data loss.</div>
            <div style="font-size:0.9em;color:#d7f8f3;margin-bottom:8px;">To confirm destructive actions, slide the confirmation control fully to the right.</div>
            <div style="display:flex;align-items:center;gap:8px;">
              <input id="twrpConfirmSlider" type="range" min="0" max="100" value="0" style="flex:1;" />
              <div id="twrpConfirmLabel" style="min-width:140px;text-align:center;color:#bff9f1;font-weight:700;">Slide to confirm</div>
            </div>
          </div>
        </div>
      </div>
    `;
    twrpScreen.style.position = 'absolute';
    twrpScreen.style.top = '24px';
    twrpScreen.style.left = '0';
    twrpScreen.style.right = '0';
    twrpScreen.style.bottom = '0';
    twrpScreen.style.background = '#001018';
    twrpScreen.style.display = 'flex';
    twrpScreen.style.flexDirection = 'column';
    twrpScreen.style.zIndex = '40';
    twrpScreen.style.fontFamily = '"Courier New", monospace';
    twrpScreen.style.color = '#0ff';
    screen.appendChild(twrpScreen);

    const installBtn = twrpScreen.querySelector('#twrpInstallImageButton');
    const wipeBtn = twrpScreen.querySelector('#twrpWipeButton');
    const formatBtn = twrpScreen.querySelector('#twrpFormatButton');
    const mountBtn = twrpScreen.querySelector('#twrpMountButton');
    const rebootBtn = twrpScreen.querySelector('#twrpRebootSystemButton');
    const confirmSlider = twrpScreen.querySelector('#twrpConfirmSlider');
    const confirmLabel = twrpScreen.querySelector('#twrpConfirmLabel');
    const twrpLog = twrpScreen.querySelector('#twrpLog');

    // new: button to open TWRP custom OS catalog
    const chooseOsBtn = twrpScreen.querySelector('#twrpChooseOsButton');
    if (chooseOsBtn) {
      chooseOsBtn.addEventListener('click', () => {
        showTwrpCustomOsList(twrpScreen);
      });
    }

    // Start with destructive actions disabled until slider reaches max
    function setDestructiveEnabled(enabled) {
      wipeBtn.disabled = !enabled;
      formatBtn.disabled = !enabled;
      installBtn.disabled = !enabled;
      wipeBtn.style.opacity = enabled ? '1' : '0.5';
      formatBtn.style.opacity = enabled ? '1' : '0.5';
      installBtn.style.opacity = enabled ? '1' : '0.5';
      wipeBtn.style.cursor = enabled ? 'pointer' : 'default';
      formatBtn.style.cursor = enabled ? 'pointer' : 'default';
      installBtn.style.cursor = enabled ? 'pointer' : 'default';
    }
    setDestructiveEnabled(false);

    // slider behavior: when at max, mark confirmed for 3s then revert
    let sliderLocked = false;
    confirmSlider.addEventListener('input', () => {
      const v = parseInt(confirmSlider.value, 10);
      if (v >= 100 && !sliderLocked) {
        sliderLocked = true;
        confirmLabel.textContent = 'Confirmed';
        setDestructiveEnabled(true);
        showToast('Confirmation accepted. You have 6 seconds to perform an action.');
        // auto-revert confirmation after timeout
        setTimeout(() => {
          confirmSlider.value = 0;
          confirmLabel.textContent = 'Slide to confirm';
          setDestructiveEnabled(false);
          sliderLocked = false;
        }, 6000);
      }
    });

    // helper to append log lines
    function appendTwrpLog(line) {
      if (twrpLog) {
        twrpLog.textContent += line + '\n';
        twrpLog.parentElement.scrollTop = twrpLog.parentElement.scrollHeight;
      }
    }

    mountBtn.addEventListener('click', () => {
      appendTwrpLog('[*] Toggling mount state for /data and /cache...');
      showToast('Mount toggled (simulated).');
      setTimeout(() => appendTwrpLog('[+] /data: rw  /cache: rw'), 600);
    });

    wipeBtn.addEventListener('click', () => {
      if (wipeBtn.disabled) {
        showToast('Slide to confirm destructive actions first.');
        return;
      }
      appendTwrpLog('[*] Wiping user data (simulated)...');
      showToast('Wiping data...', 3000);
      setDestructiveEnabled(false);
      confirmSlider.value = 0;
      confirmLabel.textContent = 'Slide to confirm';
      setTimeout(() => appendTwrpLog('[+] Data wipe complete.'), 1800);
    });

    formatBtn.addEventListener('click', () => {
      if (formatBtn.disabled) {
        showToast('Slide to confirm destructive actions first.');
        return;
      }
      appendTwrpLog('[*] Formatting /data (simulated)...');
      showToast('Formatting data partition...', 3000);
      setDestructiveEnabled(false);
      confirmSlider.value = 0;
      confirmLabel.textContent = 'Slide to confirm';
      setTimeout(() => appendTwrpLog('[+] Format complete.'), 2000);
    });

    installBtn.addEventListener('click', () => {
      if (installBtn.disabled) {
        showToast('Slide to confirm destructive actions first.');
        return;
      }
      // simple small installer dialog
      appendTwrpLog('[*] Installing selected image (simulated)...');
      showToast('Installing image...', 2500);
      setDestructiveEnabled(false);
      confirmSlider.value = 0;
      confirmLabel.textContent = 'Slide to confirm';
      setTimeout(() => {
        appendTwrpLog('[+] Image flashed to /dev/system (simulated).');
        showToast('Install complete. Returning to TWRP view.', 2500);
      }, 1800);
    });

    rebootBtn.addEventListener('click', () => {
      showToast("Rebooting system...");
      twrpScreen.remove();
      currentOS = "Android";
      if (homeScreen) {
        homeScreen.style.display = 'grid';
        homeScreen.style.opacity = '1';
      }
    });
  }

  function installLinuxOs() {
    const device = document.querySelector('.device');
    if (!device || !bootloaderUnlocked) {
      showToast("Bootloader must be unlocked to install custom OS.");
      return;
    }
    if (!twrpInstalled) {
      showToast("TWRP must be installed to flash Linux (simulated).");
      return;
    }

    // Remove any existing Linux UI
    const existingLinux = document.getElementById('linuxOsScreen');
    if (existingLinux) existingLinux.remove();
    const existingTwrp = document.getElementById('twrpRecoveryScreen');
    if (existingTwrp) existingTwrp.remove();

    // Installation overlay
    const installOverlay = document.createElement('div');
    installOverlay.id = 'linuxInstallOverlay';
    installOverlay.innerHTML = `
      <div class="linux-install-log">
        <h3>Installing Linux Mobile OS via TWRP...</h3>
        <pre id="linuxInstallLog"></pre>
      </div>
    `;
    device.appendChild(installOverlay);

    const logElem = installOverlay.querySelector('#linuxInstallLog');
    const steps = [
      "[*] Checking bootloader status... OK",
      "[*] Detecting TWRP recovery... OK",
      "[*] Wiping /system partition...",
      "[*] Formatting /data...",
      "[*] Flashing Linux kernel...",
      "[*] Installing root filesystem...",
      "[*] Writing boot configuration...",
      "[*] Finalizing installation...",
      "[*] Installation complete. Rebooting to Linux..."
    ];
    let idx = 0;

    function appendStep() {
      if (idx < steps.length) {
        logElem.textContent += steps[idx] + "\n";
        idx++;
        setTimeout(appendStep, 500);
      } else {
        currentOS = "Linux";
        try { localStorage.setItem('currentOS', 'Linux'); } catch(e) {}
        setTimeout(() => {
          installOverlay.remove();
          bootLinuxOs();
        }, 800);
      }
    }
    appendStep();
  }

  function bootLinuxOs() {
    const screen = document.querySelector('.screen');
    if (!screen) return;

    // Hide Android UI
    const homeScreen = document.getElementById('homeScreen');
    const appWindow = document.getElementById('appWindow');
    if (homeScreen) homeScreen.style.display = 'none';
    if (appWindow) appWindow.classList.remove('open');

    // Remove any existing Linux screen
    const existingLinux = document.getElementById('linuxOsScreen');
    if (existingLinux) existingLinux.remove();

    const linuxScreen = document.createElement('div');
    linuxScreen.id = 'linuxOsScreen';
    linuxScreen.innerHTML = `
      <div class="linux-status-bar">GNU/Linux · root@android-sim: /dev/tty1</div>
      <div class="linux-terminal">
        <pre id="linuxBootLog"></pre>
        <div class="linux-terminal-input">
          <span id="linuxPrompt">root@android-sim:~# </span>
          <input id="linuxCommandInput" type="text" autocomplete="off" spellcheck="false" />
        </div>
      </div>
      <div class="linux-actions">
        <button id="linuxRebootAndroidButton">Reboot to Android Sim</button>
      </div>
    `;
    screen.appendChild(linuxScreen);

    const bootLog = linuxScreen.querySelector('#linuxBootLog');
    const cmdInput = linuxScreen.querySelector('#linuxCommandInput');
    const bootLines = [
      "GNU GRUB 2.06  booting GNU/Linux...",
      "Loading Linux kernel 5.15.0-sim ... done",
      "Loading initial ramdisk ... done",
      "",
      "[    0.000000] Linux version 5.15.0-sim (root@android-sim) (gcc (GCC) 11.2.0) #1 SMP",
      "[    0.000000] Command line: quiet splash",
      "[    0.123456] CPU0: Online",
      "[    0.234567] Memory: 1024MB",
      "[    0.345678] Mounting root filesystem /dev/sim-root (ext4) ... ok",
      "[    1.000000] Starting systemd 249 (simulated) ...",
      "[    1.250000] Reached target Basic System",
      "[    1.500000] Reached target Graphical Interface",
      "",
      "Welcome to GNU/Linux (simulated).",
      "",
      "root@android-sim:~#"
    ];
    let i = 0;
    function appendBootLine() {
      if (i < bootLines.length) {
        bootLog.textContent += bootLines[i] + "\n";
        i++;
        setTimeout(appendBootLine, 200);
      }
    }
    appendBootLine();

    // Focus the command input after boot
    setTimeout(() => {
      if (cmdInput) cmdInput.focus();
    }, 2500);

    // Simple shell command handler
    if (cmdInput) {
      cmdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const cmd = cmdInput.value.trim();
          const prompt = "root@android-sim:~# ";
          if (cmd !== "") {
            bootLog.textContent += prompt + cmd + "\n";
          } else {
            bootLog.textContent += prompt + "\n";
          }

          handleLinuxCommand(cmd, bootLog, homeScreen, linuxScreen);
          cmdInput.value = "";
          bootLog.parentElement.scrollTop = bootLog.parentElement.scrollHeight;
        }
      });
    }

    linuxScreen
      .querySelector('#linuxRebootAndroidButton')
      .addEventListener('click', () => {
        showToast("Rebooting back to Android 1.0 Sim...");
        linuxScreen.remove();
        currentOS = "Android";
        if (homeScreen) {
          homeScreen.style.display = 'grid';
          homeScreen.style.opacity = '1';
        }
      });

    // >>> Auto-launch visual desktop (avoid leaving user at terminal)
    // After the simulated boot log finishes, transition to the Linux24 visual desktop automatically.
    setTimeout(() => {
      // hide the terminal view and actions for a clean GUI experience
      const terminalElem = linuxScreen.querySelector('.linux-terminal');
      const actionsElem = linuxScreen.querySelector('.linux-actions');
      if (terminalElem) terminalElem.style.display = 'none';
      if (actionsElem) actionsElem.style.display = 'none';
      // start the visual desktop
      bootLinuxDesktop(linuxScreen);
    }, 1800);
  }

  // NEW: basic simulated shell commands
  function handleLinuxCommand(cmd, bootLog, homeScreen, linuxScreen) {
    const lower = cmd.toLowerCase();
    switch (lower) {
      case "":
        // nothing extra
        break;
      case "help":
        bootLog.textContent += "Available commands: help, uname -a, ls, clear, reboot, exit, startx, linux24\n";
        break;
      case "uname":
      case "uname -a":
        bootLog.textContent += "Linux android-sim 5.15.0-sim #1 SMP PREEMPT GNU/Linux\n";
        break;
      case "ls":
        bootLog.textContent += "bin  boot  dev  etc  home  lib  media  mnt  opt  proc  root  run  sbin  srv  tmp  usr  var\n";
        break;
      case "clear":
        bootLog.textContent = "";
        break;
      case "startx":
      case "linux24":
        bootLog.textContent += "Starting Linux 24 desktop session...\n";
        bootLinuxDesktop(linuxScreen);
        break;
      case "reboot":
      case "exit":
        bootLog.textContent += "Rebooting to Android 1.0 Sim...\n";
        setTimeout(() => {
          if (linuxScreen) linuxScreen.remove();
          currentOS = "Android";
          if (homeScreen) {
            homeScreen.style.display = 'grid';
            homeScreen.style.opacity = '1';
          }
          showToast("System rebooted to Android 1.0 Sim");
        }, 800);
        break;
      default:
        bootLog.textContent += `bash: ${cmd.split(" ")[0]}: command not found\n`;
        break;
    }
  }

  // NEW: simple visual "Linux 24" desktop on top of the Linux TTY
  function bootLinuxDesktop(linuxScreen) {
    if (!linuxScreen) return;

    // Avoid duplicates
    if (document.getElementById('linux24Desktop')) return;

    const terminal = linuxScreen.querySelector('.linux-terminal');
    const actions = linuxScreen.querySelector('.linux-actions');
    if (terminal) terminal.style.display = 'none';
    if (actions) actions.style.display = 'none';

    const desktop = document.createElement('div');
    desktop.id = 'linux24Desktop';
    desktop.className = 'linux24-desktop';
    desktop.innerHTML = `
      <div class="linux24-desktop-bg"></div>
      <div class="linux24-panel">
        <div class="linux24-panel-left">
          <div class="linux24-logo">🐧</div>
          <span class="linux24-title">Linux 24 Desktop</span>
        </div>
        <div class="linux24-panel-right">
          <span class="linux24-panel-item">🌐</span>
          <span class="linux24-panel-item">🔊</span>
          <span class="linux24-panel-clock" id="linux24PanelClock">24:00</span>
        </div>
      </div>
      <div class="linux24-desktop-content">
        <div class="linux24-icon-grid">
          <button class="linux24-icon" data-app="files">
            <div class="linux24-icon-badge" style="background:#16a085;">📁</div>
            <span>Files</span>
          </button>
          <button class="linux24-icon" data-app="browser">
            <div class="linux24-icon-badge" style="background:#2980b9;">🌐</div>
            <span>Web</span>
          </button>
          <button class="linux24-icon" data-app="terminal">
            <div class="linux24-icon-badge" style="background:#8e44ad;">_</div>
            <span>Terminal</span>
          </button>
        </div>
        <div class="linux24-window" id="linux24MainWindow">
          <div class="linux24-window-titlebar">
            <span class="linux24-window-title" id="linux24WindowTitle">Welcome to Linux 24</span>
            <button class="linux24-window-close" id="linux24ExitButton">×</button>
          </div>
          <div class="linux24-window-content" id="linux24WindowContent">
            <p>This is a simulated visual desktop based on a fictional Linux 24 release.</p>
            <p>Tap the icons at the top to open Files, Web, or a mini Terminal.</p>
          </div>
        </div>
      </div>
    `;
    linuxScreen.appendChild(desktop);

    // Simple clock for the panel
    const clockElem = desktop.querySelector('#linux24PanelClock');
    function updateDesktopClock() {
      if (!clockElem) return;
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      clockElem.textContent = `${h}:${m}`;
    }
    updateDesktopClock();
    const clockInterval = setInterval(updateDesktopClock, 60000);

    const mainWindow = desktop.querySelector('#linux24MainWindow');
    const titleElem = desktop.querySelector('#linux24WindowTitle');
    const contentElem = desktop.querySelector('#linux24WindowContent');

    // helpers to switch "apps" inside the main Linux 24 window
    function openLinux24App(app) {
      if (!titleElem || !contentElem) return;
      switch (app) {
        case 'files':
          titleElem.textContent = 'Files – /home/linux24';
          contentElem.innerHTML = `
            <p>Files in this folder:</p>
            <ul class="linux24-file-list">
              <li>Documents/</li>
              <li>Downloads/</li>
              <li>Pictures/</li>
              <li>Music/</li>
              <li>Videos/</li>
              <li>README-linux24.txt</li>
            </ul>
            <p style="margin-top:8px;opacity:0.8;">Tip: This is a fake file manager for fun.</p>
          `;
          break;
        case 'browser':
          titleElem.textContent = 'Web Browser';
          contentElem.innerHTML = `
            <p>linux24://start – Simulated Browser</p>
            <p>You are offline (because this is just a simulation).</p>
            <p style="margin-top:6px;opacity:0.85;">Imagine surfing the web from your Linux 24 phone!</p>
          `;
          break;
        case 'terminal':
          titleElem.textContent = 'Mini Terminal';
          contentElem.innerHTML = `
            <div class="linux24-terminal-view">
              <pre>$ echo "Hello from Linux 24 GUI!"
Hello from Linux 24 GUI!

$ ls
Desktop  Documents  Downloads  Music  Pictures  Videos

$ uname -a
Linux linux24-sim 5.15.0-sim #1 SMP PREEMPT GNU/Linux
              </pre>
            </div>
            <p style="margin-top:6px;opacity:0.8;">For real commands, exit to the text console.</p>
          `;
          break;
        default:
          titleElem.textContent = 'Welcome to Linux 24';
          contentElem.innerHTML = `
            <p>This is a simulated visual desktop based on a fictional Linux 24 release.</p>
            <p>Tap the icons at the top to open Files, Web, or a mini Terminal.</p>
          `;
          break;
      }
      if (mainWindow) {
        mainWindow.style.display = 'block';
      }
    }

    // icon click handlers
    const icons = desktop.querySelectorAll('.linux24-icon');
    icons.forEach(icon => {
      icon.addEventListener('click', () => {
        const app = icon.getAttribute('data-app');
        openLinux24App(app);
      });
    });

    // Exit button to go back to TTY
    const exitBtn = desktop.querySelector('#linux24ExitButton');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        clearInterval(clockInterval);
        desktop.remove();
        if (terminal) terminal.style.display = 'flex';
        if (actions) actions.style.display = 'flex';
      });
    }

    // start on welcome "about" window
    openLinux24App('files');
  }

  // App icons and window interactions
  const appWindow = document.getElementById('appWindow');
  const closeAppBtn = document.getElementById('closeApp');
  const appTitleElem = document.getElementById('appTitle');
  const homeScreen = document.getElementById('homeScreen');
  const homeButton = document.getElementById('homeButton');

  const appNameMap = {
    phone: "Phone",
    messages: "Messages",
    browser: "Browser",
    settings: "Settings",
    googleplay: "Google Play",
    antivirus: "Antivirus"
  };

  // Use delegated clicks so dynamically-created icons or overlays still respond
  document.addEventListener('click', (e) => {
    const appIcon = e.target.closest('.app-icon');
    if (appIcon) {
      const appName = (appIcon.dataset.app || '').toLowerCase();
      if (appName) openApp(appName);
    }
  });

  if (closeAppBtn) closeAppBtn.addEventListener('click', closeApp);

  if (homeButton) {
    homeButton.addEventListener('click', () => {
      if (appWindow && appWindow.classList.contains('open')) {
        closeApp();
      } else {
        showToast("Home button pressed");
      }
    });
  }

  function openApp(appName) {
    const displayName = appNameMap[appName] || capitalizeFirstLetter(appName);
    appTitleElem.textContent = displayName;
    loadAppContent(appName);
    appWindow.classList.add('open');
    homeScreen.style.opacity = "0";
    setTimeout(() => {
      homeScreen.style.display = "grid";
    }, 300);
  }

  function closeApp() {
    appWindow.classList.remove('open');
    homeScreen.style.display = "grid";
    setTimeout(() => {
      homeScreen.style.opacity = "1";
    }, 10);
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Load dynamic content for each app into the app window
  function loadAppContent(appName) {
    const contentContainer = appWindow.querySelector('.window-content');
    switch(appName) {
      case 'phone':
        contentContainer.innerHTML = getPhoneAppContent();
        initPhoneApp();
        break;
      case 'messages':
        contentContainer.innerHTML = getMessagesAppContent();
        initMessagesApp();
        break;
      case 'browser':
        contentContainer.innerHTML = getBrowserAppContent();
        initBrowserApp();
        break;
      case 'settings':
        contentContainer.innerHTML = getSettingsAppContent();
        initSettingsApp();
        break;
      case 'googleplay':
        contentContainer.innerHTML = getGooglePlayAppContent();
        initGooglePlayApp();
        break;
      case 'antivirus':
        contentContainer.innerHTML = getAntivirusAppContent();
        initAntivirusApp();
        break;
      default:
        contentContainer.innerHTML = `<p>Welcome to the ${capitalizeFirstLetter(appName)} app!</p>`;
    }
  }

  /* -------- Phone App -------- */
  function getPhoneAppContent() {
    return `
      <div class="phone-app">
        <div class="phone-display" id="phoneDisplay"></div>
        <div class="dial-pad">
          <button class="digit" data-digit="1">1</button>
          <button class="digit" data-digit="2">2</button>
          <button class="digit" data-digit="3">3</button>
          <button class="digit" data-digit="4">4</button>
          <button class="digit" data-digit="5">5</button>
          <button class="digit" data-digit="6">6</button>
          <button class="digit" data-digit="7">7</button>
          <button class="digit" data-digit="8">8</button>
          <button class="digit" data-digit="9">9</button>
          <button class="digit" data-digit="*">*</button>
          <button class="digit" data-digit="0">0</button>
          <button class="digit" data-digit="#">#</button>
        </div>
        <button id="callButton">Call</button>
      </div>
    `;
  }

  function initPhoneApp() {
    const phoneDisplay = document.getElementById('phoneDisplay');
    const digitButtons = document.querySelectorAll('.dial-pad .digit');
    const callButton = document.getElementById('callButton');
    phoneDisplay.textContent = "";
    digitButtons.forEach(button => {
      button.addEventListener('click', () => {
        phoneDisplay.textContent += button.dataset.digit;
      });
    });
    callButton.addEventListener('click', () => {
      if(phoneDisplay.textContent.trim() === "") {
        showToast("Please dial a number");
      } else {
        showToast("Calling " + phoneDisplay.textContent + "...");
        phoneDisplay.textContent = "";
      }
    });
  }

  /* -------- Messages App -------- */
  function getMessagesAppContent() {
    return `
      <div class="messages-app">
        <div class="message-list" id="messageList"></div>
        <div class="message-input">
          <input type="text" id="messageInput" placeholder="Type a message..."/>
          <button id="sendMessageButton">Send</button>
        </div>
      </div>
    `;
  }

  function initMessagesApp() {
    const messageList = document.getElementById('messageList');
    const messageInput = document.getElementById('messageInput');
    const sendMessageButton = document.getElementById('sendMessageButton');
    sendMessageButton.addEventListener('click', () => {
      const text = messageInput.value.trim();
      if(text) {
        const messageElem = document.createElement('div');
        messageElem.className = 'message';
        messageElem.textContent = text;
        messageList.appendChild(messageElem);
        messageInput.value = '';
        messageList.scrollTop = messageList.scrollHeight;
      }
    });
  }

  /* -------- Browser App -------- */
  function getBrowserAppContent() {
    return `
      <div class="browser-app">
        <div class="address-bar">
          <input type="text" id="browserAddress" placeholder="Enter URL..."/>
          <button id="goButton">Go</button>
        </div>
        <div class="browser-content" id="browserContent">
          Welcome to the browser. Please enter a URL and click Go.
        </div>
      </div>
    `;
  }

  function initBrowserApp() {
    const goButton = document.getElementById('goButton');
    const browserAddress = document.getElementById('browserAddress');
    const browserContent = document.getElementById('browserContent');
    goButton.addEventListener('click', () => {
      const url = browserAddress.value.trim();
      if(url) {
        browserContent.innerHTML = `<h3>${url}</h3><p>This is a simulated webpage for ${url}.</p>`;
      } else {
        showToast("Please enter a URL");
      }
    });
  }

  /* -------- Settings App -------- */
  function getSettingsAppContent() {
    return `
      <div class="settings-app">
        <div class="setting-group">
          <div class="setting-group-title">Display</div>
          <div class="setting-item">
            <span class="setting-item-title">Brightness</span>
            <input type="range" id="brightnessSlider" min="0" max="100" value="75">
          </div>
          <div class="setting-item">
            <span class="setting-item-title">Theme</span>
            <select id="themeSelect">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system" selected>System Default</option>
            </select>
          </div>
          <div class="setting-item">
            <span class="setting-item-title">Font Size</span>
            <select id="fontSizeSelect">
              <option value="small">Small</option>
              <option value="normal" selected>Normal</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-group-title">Sound</div>
          <div class="setting-item">
            <span class="setting-item-title">Volume</span>
            <input type="range" id="volumeSlider" min="0" max="100" value="50">
          </div>
          <div class="setting-item">
            <span class="setting-item-title">Ringtone</span>
            <select id="ringtoneSelect">
              <option value="ringtone1">Ringtone 1</option>
              <option value="ringtone2">Ringtone 2</option>
              <option value="ringtone3" selected>Ringtone 3</option>
            </select>
          </div>
          <div class="setting-item">
            <span class="setting-item-title">Notification Sound</span>
            <select id="notificationSoundSelect">
              <option value="sound1">Sound 1</option>
              <option value="sound2" selected>Sound 2</option>
              <option value="sound3">Sound 3</option>
            </select>
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-group-title">Security</div>
          <div class="setting-item">
            <span class="setting-item-title">Screen Lock</span>
            <label class="switch">
              <input type="checkbox" id="screenLockToggle" checked>
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <span class="setting-item-title">Fingerprint</span>
            <label class="switch">
              <input type="checkbox" id="fingerprintToggle">
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <span class="setting-item-title">Face Unlock</span>
            <label class="switch">
              <input type="checkbox" id="faceUnlockToggle">
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <span class="setting-item-title">Find My Device</span>
            <label class="switch">
              <input type="checkbox" id="findMyDeviceToggle">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-group-title">System</div>
          <div class="setting-item">
            <span class="setting-item-title">Wi-Fi</span>
            <label class="switch">
              <input type="checkbox" id="wifiToggle" checked>
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <span class="setting-item-title">Bluetooth</span>
            <label class="switch">
              <input type="checkbox" id="bluetoothToggle">
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <span class="setting-item-title">Airplane Mode</span>
            <label class="switch">
              <input type="checkbox" id="airplaneToggle">
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <span class="setting-item-title">Dark Mode</span>
            <label class="switch">
              <input type="checkbox" id="darkModeToggle">
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <span class="setting-item-title">Screen Timeout</span>
            <select id="screenTimeout">
              <option value="15s">15 seconds</option>
              <option value="30s">30 seconds</option>
              <option value="1m" selected>1 minute</option>
              <option value="2m">2 minutes</option>
              <option value="5m">5 minutes</option>
              <option value="10m">10 minutes</option>
              <option value="30m">30 minutes</option>
            </select>
          </div>
          <div class="setting-item">
            <span class="setting-item-title">Language</span>
            <select id="languageSelect">
              <option value="en-US" selected>English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Español</option>
              <option value="fr-FR">Français</option>
              <option value="de-DE">Deutsch</option>
            </select>
          </div>
          <div class="setting-item">
            <span class="setting-item-title">Date & Time</span>
            <button id="dateTimeButton">Set Date & Time</button>
          </div>
          <div class="setting-item">
            <span class="setting-item-title">Backup & Reset</span>
            <button id="backupResetButton">Backup & Reset Options</button>
          </div>
          <div class="setting-item">
            <span class="setting-item-title">About Phone</span>
            <button id="aboutPhoneButton">About Device</button>
          </div>
        </div>
      </div>
    `;
  }

  function initSettingsApp() {
    // ...existing settings init code...
    document.getElementById('wifiToggle').addEventListener('change', (e) => {
      console.log('Wi-Fi toggled: ' + e.target.checked);
      showToast("Wi-Fi: " + (e.target.checked ? "On" : "Off"));
    });
    document.getElementById('bluetoothToggle').addEventListener('change', (e) => {
      console.log('Bluetooth toggled: ' + e.target.checked);
      showToast("Bluetooth: " + (e.target.checked ? "On" : "Off"));
    });
    document.getElementById('airplaneToggle').addEventListener('change', (e) => {
      console.log('Airplane Mode toggled: ' + e.target.checked);
      showToast("Airplane Mode: " + (e.target.checked ? "On" : "Off"));
    });
    document.getElementById('darkModeToggle').addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.classList.add('dark-mode');
        showToast("Dark Mode:On");
      } else {
        document.body.classList.remove('dark-mode');
        showToast("Dark Mode: Off");
      }
    });
    document.getElementById('screenTimeout').addEventListener('change', (e) => {
      showToast("Screen Timeout: " + e.target.value);
    });

    // New settings initializations
    document.getElementById('brightnessSlider').addEventListener('input', (e) => {
      console.log('Brightness changed: ' + e.target.value);
      showToast("Brightness: " + e.target.value + "%");
      // In a real device, you'd adjust screen brightness here
    });
    document.getElementById('themeSelect').addEventListener('change', (e) => {
      const theme = e.target.value;
      console.log('Theme selected: ' + theme);
      showToast("Theme: " + capitalizeFirstLetter(theme));
      if (theme === 'dark') {
        document.body.classList.add('dark-mode');
      } else if (theme === 'light') {
        document.body.classList.remove('dark-mode');
      } else if (theme === 'system') {
        // Implement system default theme detection if needed
        showToast("Theme: System Default (simulated)");
      }
    });
    document.getElementById('fontSizeSelect').addEventListener('change', (e) => {
      const fontSize = e.target.value;
      console.log('Font Size selected: ' + fontSize);
      showToast("Font Size: " + capitalizeFirstLetter(fontSize));
      // In a real device, you'd adjust font size here
    });
    document.getElementById('volumeSlider').addEventListener('input', (e) => {
      console.log('Volume changed: ' + e.target.value);
      showToast("Volume: " + e.target.value + "%");
      // In a real device, you'd adjust volume here
    });
    document.getElementById('ringtoneSelect').addEventListener('change', (e) => {
      const ringtone = e.target.value;
      console.log('Ringtone selected: ' + ringtone);
      showToast("Ringtone: " + capitalizeFirstLetter(ringtone));
      // In a real device, you'd change ringtone here
    });
    document.getElementById('notificationSoundSelect').addEventListener('change', (e) => {
      const notificationSound = e.target.value;
      console.log('Notification sound selected: ' + notificationSound);
      showToast("Notification Sound: " + capitalizeFirstLetter(notificationSound));
      // In a real device, you'd change notification sound here
    });
    document.getElementById('screenLockToggle').addEventListener('change', (e) => {
      console.log('Screen Lock toggled: ' + e.target.checked);
      showToast("Screen Lock: " + (e.target.checked ? "On" : "Off"));
    });
    document.getElementById('fingerprintToggle').addEventListener('change', (e) => {
      console.log('Fingerprint toggled: ' + e.target.checked);
      showToast("Fingerprint Authentication: " + (e.target.checked ? "On" : "Off"));
    });
    document.getElementById('faceUnlockToggle').addEventListener('change', (e) => {
      console.log('Face Unlock toggled: ' + e.target.checked);
      showToast("Face Unlock: " + (e.target.checked ? "On" : "Off"));
    });
    document.getElementById('findMyDeviceToggle').addEventListener('change', (e) => {
      console.log('Find My Device toggled: ' + e.target.checked);
      showToast("Find My Device: " + (e.target.checked ? "On" : "Off"));
    });
    document.getElementById('languageSelect').addEventListener('change', (e) => {
      const language = e.target.value;
      console.log('Language selected: ' + language);
      showToast("Language: " + language);
      // In a real device, you'd change language settings here
    });
    document.getElementById('dateTimeButton').addEventListener('click', () => {
      showToast("Opening Date & Time settings (simulated)");
      // In a real device, you'd open date & time settings
    });
    document.getElementById('backupResetButton').addEventListener('click', () => {
      showToast("Opening Backup & Reset settings (simulated)");
      // In a real device, you'd open backup & reset settings
    });
    document.getElementById('aboutPhoneButton').addEventListener('click', () => {
      showToast("Opening About Phone (simulated)");
      // In a real device, you'd open about phone info
    });
  }

  /* -------- Google Play App -------- */
  function getGooglePlayAppContent() {
    return `
      <div class="googleplay-app">
        <div class="app-store-grid">
          <div class="store-app" data-app="app1">
            <div class="icon-wrapper">
              <svg viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="#FF5722"/>
              </svg>
            </div>
            <span>Fake App 1</span>
            <button class="download-button">Download</button>
          </div>
          <div class="store-app" data-app="app2">
            <div class="icon-wrapper">
              <svg viewBox="0 0 64 64">
                <rect x="12" y="12" width="40" height="40" fill="#3F51B5"/>
              </svg>
            </div>
            <span>Fake App 2</span>
            <button class="download-button">Download</button>
          </div>
          <div class="store-app" data-app="app3">
            <div class="icon-wrapper">
              <svg viewBox="0 0 64 64">
                <polygon points="32,4 60,56 4,56" fill="#4CAF50"/>
              </svg>
            </div>
            <span>Fake App 3</span>
            <button class="download-button">Download</button>
          </div>
          <div class="store-app" data-app="app4">
            <div class="icon-wrapper">
              <svg viewBox="0 0 64 64">
                <rect x="8" y="8" width="48" height="48" rx="8" fill="#9C27B0"/>
              </svg>
            </div>
            <span>Fake App 4</span>
            <button class="download-button">Download</button>
          </div>
          <div class="store-app" data-app="app5">
            <div class="icon-wrapper">
              <svg viewBox="0 0 64 64">
                <ellipse cx="32" cy="32" rx="28" ry="18" fill="#FFC107"/>
              </svg>
            </div>
            <span>Fake App 5</span>
            <button class="download-button">Download</button>
          </div>
          <div class="store-app" data-app="app6">
            <div class="icon-wrapper">
              <svg viewBox="0 0 64 64">
                <rect x="16" y="16" width="32" height="32" fill="#8BC34A"/>
              </svg>
            </div>
            <span>Fake App 6</span>
            <button class="download-button">Download</button>
          </div>
          <div class="store-app" data-app="app7">
            <div class="icon-wrapper">
              <svg viewBox="0 0 64 64">
                <polygon points="32,8 56,56 8,56" fill="#00BCD4"/>
              </svg>
            </div>
            <span>Fake App 7</span>
            <button class="download-button">Download</button>
          </div>
        </div>
      </div>
    `;
  }

  function initGooglePlayApp() {
    const downloadButtons = document.querySelectorAll('.download-button');
    downloadButtons.forEach(button => {
      button.addEventListener('click', () => {
        const appName = button.parentElement.querySelector('span').textContent;
        // 50% chance for normal download or virus infection
        if (Math.random() < 0.5) {
          button.textContent = "Downloading...";
          setTimeout(() => {
            button.textContent = "Downloaded";
            showToast(appName + " downloaded!");
          }, 1000);
        } else {
          const virusNames = ["WormX", "TrojanX", "SpywareZ", "RansomY", "AdwareV"];
          const virusName = virusNames[Math.floor(Math.random() * virusNames.length)];
          button.textContent = "Infecting...";
          setTimeout(() => {
            button.textContent = "Virus " + virusName;
            runVirusInstallation(virusName);
          }, 1000);
        }
      });
    });
  }

  /* -------- Trojan Installation Simulation -------- */
  function runTrojanInstallation() {
    const trojanOverlay = document.createElement('div');
    trojanOverlay.id = 'trojanOverlay';
    trojanOverlay.style.position = 'absolute';
    trojanOverlay.style.top = '0';
    trojanOverlay.style.left = '0';
    trojanOverlay.style.right = '0';
    trojanOverlay.style.bottom = '0';
    trojanOverlay.style.background = 'rgba(255, 0, 0, 0.8)';
    trojanOverlay.style.color = '#fff';
    trojanOverlay.style.display = 'flex';
    trojanOverlay.style.flexDirection = 'column';
    trojanOverlay.style.justifyContent = 'center';
    trojanOverlay.style.alignItems = 'center';
    trojanOverlay.style.zIndex = '100';
    trojanOverlay.style.fontSize = '1.5em';
    trojanOverlay.style.fontFamily = 'monospace';
    trojanOverlay.innerHTML = `
      <svg viewBox="0 0 100 100" width="100" height="100" style="margin-bottom:20px">
        <polygon points="50,0 100,100 0,100" fill="#000"/>
      </svg>
      <p>Trojan installing...</p>
    `;
    document.querySelector('.device').appendChild(trojanOverlay);
    
    setTimeout(() => {
      trojanOverlay.innerHTML = `
        <svg viewBox="0 0 100 100" width="100" height="100" style="margin-bottom:20px">
          <polygon points="50,0 100,100 0,100" fill="#000"/>
        </svg>
        <p>Trojan installed! Your device is compromised!</p>
      `;
      showToast("Trojan installed!", 4000);
      setTimeout(() => {
        trojanOverlay.remove();
      }, 5000);
    }, 3000);
  }

  /* -------- Virus Installation Simulation for Google Play Apps -------- */
  function runVirusInstallation(virusName) {
    const virusOverlay = document.createElement('div');
    virusOverlay.id = 'virusOverlay';
    virusOverlay.style.position = 'absolute';
    virusOverlay.style.top = '0';
    virusOverlay.style.left = '0';
    virusOverlay.style.right = '0';
    virusOverlay.style.bottom = '0';
    virusOverlay.style.background = 'rgba(255, 0, 0, 0.8)';
    virusOverlay.style.color = '#fff';
    virusOverlay.style.display = 'flex';
    virusOverlay.style.flexDirection = 'column';
    virusOverlay.style.justifyContent = 'center';
    virusOverlay.style.alignItems = 'center';
    virusOverlay.style.zIndex = '100';
    virusOverlay.style.fontSize = '1.5em';
    virusOverlay.style.fontFamily = 'monospace';
    virusOverlay.innerHTML = `
      <svg viewBox="0 0 100 100" width="100" height="100" style="margin-bottom:20px">
        <polygon points="50,0 100,100 0,100" fill="#fff"/>
      </svg>
      <p>Virus ${virusName} installing...</p>
    `;
    document.querySelector('.device').appendChild(virusOverlay);

    setTimeout(() => {
      virusOverlay.innerHTML = `
        <svg viewBox="0 0 100 100" width="100" height="100" style="margin-bottom:20px">
          <polygon points="50,0 100,100 0,100" fill="#fff"/>
        </svg>
        <p>Virus ${virusName} activated! Device compromised!</p>
      `;
      showToast("Warning: Virus " + virusName + " has infected your device!", 4000);
      setTimeout(() => {
        virusOverlay.remove();
      }, 5000);
    }, 3000);
  }

  /* -------- BIOS Simulation (Samsung BIOS) -------- */
  function runBios() {
    const biosOverlay = document.getElementById('biosOverlay');
    if (!biosOverlay) return;
    biosOverlay.textContent = "";
    const lines = [
      "Samsung BIOS v12.0",
      "Copyright (C) 2023 Samsung Electronics",
      "",
      "Initializing Samsung system...",
      "Performing memory test: 16384MB OK",
      "Detecting hardware...",
      "CPU: Exynos 2200 detected",
      "RAM: 12GB detected",
      "Storage: UFS 4.0 detected",
      "Sensors: Multi-touch, Gyro, Proximity, Ambient Light active",
      "Video: Dynamic AMOLED Display initialized",
      "",
      "Loading system modules...",
      "Enabling advanced hardware virtualization...",
      "Security protocols: Active, Secure Boot enabled",
      "",
      "Launching modern bootloader interface...",
      "",
      "Press F2 for Setup   F12 for Boot Menu",
      ""
    ];
    let index = 0;
    function appendNextLine() {
      if (index < lines.length) {
        biosOverlay.textContent += lines[index] + "\n";
        index++;
        setTimeout(appendNextLine, 500);
      } else {
        setTimeout(() => {
          biosOverlay.style.opacity = "0";
          setTimeout(() => {
            biosOverlay.remove();
          }, 1000);
        }, 1000);
      }
    }
    appendNextLine();
  }
  
  runBios();

  // Reset Button logic
  const resetButton = document.getElementById('resetButton');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      showToast("Device resetting...");
      setTimeout(() => {
         location.reload();
      }, 1500);
    });
  }

  // Corrupt BIOS Button logic and function
  function runCorruptBios() {
    let biosOverlay = document.getElementById('biosOverlay');
    if (!biosOverlay) {
      biosOverlay = document.createElement('div');
      biosOverlay.id = 'biosOverlay';
      biosOverlay.style.position = 'absolute';
      biosOverlay.style.top = '0';
      biosOverlay.style.left = '0';
      biosOverlay.style.right = '0';
      biosOverlay.style.bottom = '0';
      biosOverlay.style.background = '#000';
      biosOverlay.style.zIndex = '20';
      biosOverlay.style.fontFamily = '"Courier New", monospace';
      biosOverlay.style.color = '#00ff00';
      biosOverlay.style.padding = '20px';
      biosOverlay.style.overflowY = 'auto';
      biosOverlay.style.whiteSpace = 'pre-wrap';
      document.querySelector('.device').appendChild(biosOverlay);
    }
    biosOverlay.classList.add('corrupt-bios-animation');
    biosOverlay.style.opacity = '1';
    biosOverlay.textContent = '';
    const corruptMessages = [
      "BIOS CORRUPTION INITIATED...",
      "LOADING MALFORMED DATA...",
      "█▓▒░▒▓█ ▒▓█ ▒█▓▒░",
      "ERR_403: SYSTEM MALFUNCTION",
      "0xDEADBEEF ERROR",
      "GLITCHING... SYSTEM OVERRIDE",
      "VIRUS DETECTED: BIOS_CORRUPTED",
      "REBOOTING..."
    ];
    let idx = 0;
    function updateCorruptMessage() {
      if (idx < corruptMessages.length) {
        biosOverlay.textContent += corruptMessages[idx] + "\n";
        idx++;
        setTimeout(updateCorruptMessage, 400);
      } else {
        setTimeout(() => {
          biosOverlay.style.opacity = "0";
          setTimeout(() => {
            biosOverlay.classList.remove('corrupt-bios-animation');
            biosOverlay.remove();
            showToast("Corrupt BIOS completed");
          }, 1000);
        }, 1000);
      }
    }
    updateCorruptMessage();
  }

  const corruptBiosButton = document.getElementById('corruptBiosButton');
  if (corruptBiosButton) {
    corruptBiosButton.addEventListener('click', runCorruptBios);
  }

  // Factory Reset: clears simulation state and reloads
  function factoryReset() {
    showToast("Performing factory reset...", 2000);
    try {
      // remove keys used by the simulation
      const keysToRemove = ['currentOS', 'twrpInstalled', 'deviceBricked'];
      keysToRemove.forEach(k => localStorage.removeItem(k));
      // clear any other app-specific state if present
      // (optionally keep user preferences out of scope)
    } catch (e) {
      console.warn("Factory reset: localStorage access failed", e);
    }
    // small delay to let toast be seen, then reload
    setTimeout(() => {
      location.reload();
    }, 1200);
  }

  // Add Factory Reset button handler (confirmation)
  const factoryResetButton = document.getElementById('factoryResetButton');
  if (factoryResetButton) {
    factoryResetButton.addEventListener('click', () => {
      // use a confirm dialog for a quick confirmation flow
      const ok = confirm("Factory Reset will clear simulation state and reload the page. Proceed?");
      if (ok) {
        factoryReset();
      } else {
        showToast("Factory reset cancelled");
      }
    });
  }

  // Dev Mode Button logic and Developer BIOS simulation
  const devModeButton = document.getElementById('devModeButton');
  let devModeActive = false;
  devModeButton.addEventListener('click', () => {
    devModeActive = !devModeActive;
    if (devModeActive) {
      document.body.classList.add('dev-mode-active');
      showToast("Dev Mode activated");
      createDevModeOverlay();
    } else {
      document.body.classList.remove('dev-mode-active');
      showToast("Dev Mode deactivated");
      removeDevModeOverlay();
    }
  });

  function createDevModeOverlay() {
    let overlay = document.getElementById('devModeOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'devModeOverlay';
      overlay.textContent = "DEV MODE: Active";
      overlay.style.position = 'absolute';
      overlay.style.top = '5px';
      overlay.style.right = '5px';
      overlay.style.padding = '5px 10px';
      overlay.style.backgroundColor = "rgba(25,118,210,0.8)";
      overlay.style.color = '#fff';
      overlay.style.fontSize = '0.8em';
      overlay.style.borderRadius = '4px';
      overlay.style.zIndex = '150';
      document.querySelector('.device').appendChild(overlay);
    }
    runDevBios();
  }

  function removeDevModeOverlay() {
    const overlay = document.getElementById('devModeOverlay');
    if (overlay) {
      overlay.remove();
    }
    const devBiosOverlay = document.getElementById('devBiosOverlay');
    if (devBiosOverlay) {
      devBiosOverlay.remove();
    }
  }

  function runDevBios() {
    let devBiosOverlay = document.getElementById('devBiosOverlay');
    if (!devBiosOverlay) {
      devBiosOverlay = document.createElement('div');
      devBiosOverlay.id = 'devBiosOverlay';
      devBiosOverlay.style.position = 'absolute';
      devBiosOverlay.style.top = '0';
      devBiosOverlay.style.left = '0';
      devBiosOverlay.style.right = '0';
      devBiosOverlay.style.bottom = '0';
      devBiosOverlay.style.background = '#000';
      devBiosOverlay.style.zIndex = '25';
      devBiosOverlay.style.fontFamily = '"Courier New", monospace';
      devBiosOverlay.style.color = '#00ff00';
      devBiosOverlay.style.padding = '20px';
      devBiosOverlay.style.overflowY = 'auto';
      devBiosOverlay.style.whiteSpace = 'pre-wrap';
      document.querySelector('.device').appendChild(devBiosOverlay);
    }
    const debugLines = [
      "DEVELOPER BIOS MODE v1.0",
      "-----------------------------------",
      "Initializing advanced debug protocols...",
      "Loading extended hardware diagnostics...",
      "CPU Debug: All cores operational",
      "Memory Debug: Test passed, ECC enabled",
      "Peripheral Debug: Sensors calibrating...",
      "I/O Debug: USB legacy mode active",
      "Network Debug: Ethernet & Wi-Fi diagnostics running...",
      "Debug Log: Variable X = 0x0F2A3B",
      "Debug Log: IRQ5 handling routine active",
      "-----------------------------------",
      "Awaiting further developer instructions..."
    ];
    let debugIndex = 0;
    devBiosOverlay.textContent = "";
    function appendDebugLine() {
      if (debugIndex < debugLines.length) {
        devBiosOverlay.textContent += debugLines[debugIndex] + "\n";
        debugIndex++;
        setTimeout(appendDebugLine, 400);
      }
    }
    appendDebugLine();
  }

  // Linux Error Button logic
  const linuxErrorButton = document.getElementById('linuxErrorButton');
  if (linuxErrorButton) {
    linuxErrorButton.addEventListener('click', runLinuxError);
  }

  function runLinuxError() {
    let linuxErrorOverlay = document.getElementById('linuxErrorOverlay');
    if (!linuxErrorOverlay) {
      linuxErrorOverlay = document.createElement('div');
      linuxErrorOverlay.id = 'linuxErrorOverlay';
      document.querySelector('.device').appendChild(linuxErrorOverlay);
    }
    linuxErrorOverlay.textContent = "";
    const errorMessages = [
      "Kernel Panic - not syncing: Fatal exception in interrupt",
      "CPU: 0 PID: 0 Comm: swapper/0 Not tainted 1.0",
      "Call Trace:",
      " [<ffffffff810d03e2>] panic+0x43/0x59",
      " [<ffffffff810d0404>] ? dump_stack+0x29/0x42",
      "Attempting to kill init! exitcode=0x00000001",
      "Rebooting in 10 seconds..."
    ];
    let idx = 0;
    function displayNextLine() {
      if (idx < errorMessages.length) {
        linuxErrorOverlay.textContent += errorMessages[idx] + "\n";
        idx++;
        setTimeout(displayNextLine, 500);
      } else {
        setTimeout(() => {
          linuxErrorOverlay.style.opacity = "0";
          setTimeout(() => {
            linuxErrorOverlay.remove();
            showToast("Linux error resolved (simulation)");
          }, 1000);
        }, 5000);
      }
    }
    displayNextLine();
  }

  /* -------- Antivirus App -------- */
  function getAntivirusAppContent() {
    return `
      <div class="antivirus-app">
        <h2>Antivirus Scan</h2>
        <div class="antivirus-message">Press "Scan" to start scan.</div>
        <button id="scanAntivirusButton">Scan for Threats</button>
        <div class="antivirus-progress-container">
          <div class="antivirus-progress-bar"></div>
        </div>
      </div>
    `;
  }
  
  function initAntivirusApp() {
    const scanButton = document.getElementById("scanAntivirusButton");
    const messageElem = document.querySelector(".antivirus-app .antivirus-message");
    const progressBar = document.querySelector(".antivirus-app .antivirus-progress-bar");
    scanButton.addEventListener("click", () => {
      scanButton.disabled = true;
      messageElem.textContent = "Scanning...";
      progressBar.style.width = "0%";
      progressBar.style.animation = "fillProgress 3s linear forwards";
      setTimeout(() => {
        let virusesDetected = false;
        const virusOverlay = document.getElementById("virusOverlay");
        if (virusOverlay) {
          virusesDetected = true;
          virusOverlay.remove();
        }
        const trojanOverlay = document.getElementById("trojanOverlay");
        if (trojanOverlay) {
          virusesDetected = true;
          trojanOverlay.remove();
        }
        if (virusesDetected) {
          messageElem.textContent = "Threats detected and removed!";
          showToast("Antivirus: Threats cleaned!", 3000);
        } else {
          messageElem.textContent = "No threats found.";
          showToast("Antivirus: No threats found.", 3000);
        }
        progressBar.style.animation = "none";
        scanButton.disabled = false;
      }, 3000);
    });
  }

  /* -------- Easter Eggs -------- */
  // Easter Egg: Click the time element 5 times quickly
  let timeClickCount = 0;
  const timeElem = document.querySelector('.status-bar .time');
  if (timeElem) {
    timeElem.addEventListener('click', () => {
      timeClickCount++;
      if (timeClickCount === 5) {
        showToast("Easter Egg: Time flies! You've found a hidden secret!");
        timeClickCount = 0;
      }
      setTimeout(() => {
        timeClickCount = 0;
      }, 2000);
    });
  }

  // Easter Egg: Konami Code detection (Up, Up, Down, Down, Left, Right, Left, Right, B, A)
  const konamiSequence = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
  let konamiIndex = 0;
  document.addEventListener('keydown', (e) => {
    if (e.keyCode === konamiSequence[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiSequence.length) {
        triggerKonamiEasterEgg();
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }
  });

  function triggerKonamiEasterEgg() {
    const overlay = document.createElement('div');
    overlay.id = 'konamiOverlay';
    overlay.textContent = "Konami Code Activated!\nEaster Egg Unlocked!";
    overlay.style.textAlign = "center";
    overlay.style.whiteSpace = "pre-line";
    overlay.addEventListener('click', () => {
      overlay.style.animation = "fadeOutBootloader 0.5s forwards";
      setTimeout(() => overlay.remove(), 500);
    });
    document.body.appendChild(overlay);
    showToast("You found a hidden easter egg!");
  }

  // Add missing function: showTwrpCustomOsList
  function showTwrpCustomOsList(parentScreen) {
    if (!parentScreen) return;
    if (document.getElementById('twrpCustomList')) return;

    // richer catalog of simulated custom OS images
    const catalog = [
      { key: 'linux-mobile', name: 'Linux Mobile OS (desktop+mobile blend)'},
      { key: 'minimal-desktop', name: 'Minimal Desktop'},
      { key: 'lightweight-server', name: 'Lightweight Server'},
      { key: 'postmarketos', name: 'postmarketOS (phone-focused)'},
      { key: 'phoenix-osp', name: 'Phoenix OS (Android-x86 style)'},
      { key: 'androidx', name: 'AndroidX (custom Android fork)'},
      { key: 'privacy-os', name: 'PrivacyOS (hardened)'},
      { key: 'cancel', name: 'Cancel' }
    ];

    const dialog = document.createElement('div');
    dialog.id = 'twrpCustomList';
    dialog.style.position = 'absolute';
    // move the dialog slightly lower and give it a high z-index so it sits above the action area
    dialog.style.left = '12px';
    dialog.style.right = '12px';
    dialog.style.top = '92px';
    dialog.style.margin = '0 auto';
    dialog.style.maxWidth = '360px';
    dialog.style.background = '#021015';
    dialog.style.border = '1px solid rgba(0,255,255,0.08)';
    dialog.style.color = '#0ff';
    dialog.style.fontFamily = '"Courier New", monospace';
    dialog.style.padding = '10px';
    // ensure it appears above the twrp-actions (which uses z-index around 1010)
    dialog.style.zIndex = '1050';
    dialog.style.pointerEvents = 'auto';

    const title = document.createElement('div');
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '8px';
    title.textContent = 'TWRP: Available Custom OS Images';
    dialog.appendChild(title);

    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '8px';
    catalog.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'twrp-os-btn';
      btn.dataset.os = item.key;
      btn.textContent = item.name;
      btn.style.padding = '8px';
      btn.style.borderRadius = '6px';
      btn.style.border = 'none';
      btn.style.background = item.key === 'cancel' ? '#051018' : '#002428';
      btn.style.color = '#0ff';
      btn.style.cursor = 'pointer';
      if (item.key === 'cancel') btn.style.marginTop = '6px';
      list.appendChild(btn);
    });
    dialog.appendChild(list);
    parentScreen.appendChild(dialog);

    // direct listeners (kept for immediate responsiveness) --
    dialog.querySelectorAll('.twrp-os-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const osKey = btn.getAttribute('data-os');
        // remove list dialog
        dialog.remove();
        if (!osKey || osKey === 'cancel') {
          showToast('Cancelled');
          return;
        }
        // Show an install image dialog with preview and "Start Install"
        showInstallImageDialog(osKey, parentScreen);
      });
    });
  }

  // New helper: show install image dialog (preview + start install)
  function showInstallImageDialog(osKey, parentScreen) {
    if (!parentScreen) return;
    // prevent duplicates
    if (document.getElementById('twrpInstallImageDialog')) return;

    const dlg = document.createElement('div');
    dlg.id = 'twrpInstallImageDialog';
    dlg.style.position = 'absolute';
    dlg.style.left = '12px';
    dlg.style.right = '12px';
    dlg.style.top = '80px';
    dlg.style.margin = '0 auto';
    dlg.style.maxWidth = '360px';
    dlg.style.background = '#011216';
    dlg.style.border = '1px solid rgba(0,255,255,0.06)';
    dlg.style.color = '#bff9f1';
    dlg.style.fontFamily = '"Courier New", monospace';
    dlg.style.padding = '12px';
    dlg.style.zIndex = '46';
    dlg.style.pointerEvents = 'auto';
    dlg.style.borderRadius = '8px';
    dlg.innerHTML = `
      <div style="font-weight:800;margin-bottom:8px;color:#ffdd57;">Install Image</div>
      <div style="margin-bottom:8px;">You selected: <strong>${formatOsName(osKey)}</strong></div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
        <div style="width:72px;height:48px;background:linear-gradient(90deg,#023 0%, #012 100%);border-radius:6px;display:flex;align-items:center;justify-content:center;color:#0ff;font-size:24px;">IMG</div>
        <div style="flex:1;color:#9ff7f0;font-size:0.9em;">Preview: Simulated image. Installing this will overwrite /system and may reboot your device.</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button id="startInstallImageBtn" style="flex:1;padding:8px;border-radius:6px;border:none;background:linear-gradient(180deg,#00a896 0%, #007d6f 100%);color:#001f1f;font-weight:800;cursor:pointer;">Start Install</button>
        <button id="cancelInstallImageBtn" style="flex:1;padding:8px;border-radius:6px;border:none;background:#051018;color:#9ff7f0;cursor:pointer;">Cancel</button>
      </div>
      <div id="installHint" style="margin-top:8px;font-size:0.85em;color:#9ff7f0;opacity:0.9;">Note: You must confirm destructive actions in TWRP (slide the confirmation slider) before installation will proceed.</div>
    `;
    parentScreen.appendChild(dlg);

    const startBtn = dlg.querySelector('#startInstallImageBtn');
    const cancelBtn = dlg.querySelector('#cancelInstallImageBtn');

    startBtn.addEventListener('click', () => {
      // Check if TWRP confirmation slider is present and confirmed
      const slider = document.querySelector('#twrpConfirmSlider');
      const sliderVal = slider ? parseInt(slider.value || '0', 10) : 0;
      if (slider && sliderVal < 100) {
        // Provide clearer feedback and nudge user to slide
        const hint = dlg.querySelector('#installHint');
        hint.textContent = 'Please slide the TWRP confirmation control fully to the right before starting the install.';
        hint.style.color = '#ffcc00';
        hint.style.fontWeight = '700';
        showToast('Slide to confirm in TWRP first.');
        return;
      }

      // Show simulated transfer preview on the phone screen before flashing
      dlg.remove();
      showToast(`Preparing to install ${formatOsName(osKey)}...`);
      const phoneScreen = document.querySelector('.screen');
      if (phoneScreen) {
        const imageOverlay = document.createElement('div');
        imageOverlay.id = 'phoneInstallImage';
        imageOverlay.style.position = 'absolute';
        imageOverlay.style.top = '24px';
        imageOverlay.style.left = '0';
        imageOverlay.style.right = '0';
        imageOverlay.style.bottom = '0';
        imageOverlay.style.background = '#000';
        imageOverlay.style.display = 'flex';
        imageOverlay.style.alignItems = 'center';
        imageOverlay.style.justifyContent = 'center';
        imageOverlay.style.zIndex = '210';
        imageOverlay.style.padding = '12px';
        imageOverlay.style.boxSizing = 'border-box';
        imageOverlay.innerHTML = `
          <div style="max-width:86%;max-height:70%;display:flex;flex-direction:column;align-items:center;gap:8px;">
            <img id="installPreviewImg" src="https://android.stackexchange.com/content/legacy-uploads/2016/07/galaxy-s-4-custom-os-830x467.png" alt="Install preview" style="max-width:100%;max-height:100%;border-radius:6px;box-shadow:0 6px 20px rgba(0,0,0,0.6);" />
            <div style="color:#9ff7f0;font-family: 'Courier New', monospace;font-size:0.85em;text-align:center;">Transferring image to device...</div>
          </div>
        `;
        phoneScreen.appendChild(imageOverlay);
        // simulate transfer delay then flash
        setTimeout(() => {
          const imgOv = document.getElementById('phoneInstallImage');
          if (imgOv) imgOv.remove();
          // call appropriate installer
          if (osKey === 'linux-mobile') {
            installLinuxOs();
          } else {
            // pass parentScreen so logs append correctly to TWRP if available
            flashCustomOs(osKey, parentScreen);
          }
        }, 4000); // keep preview visible for 4s
      } else {
        // fallback: proceed immediately if phone screen missing
        if (osKey === 'linux-mobile') {
          installLinuxOs();
        } else {
          flashCustomOs(osKey, parentScreen);
        }
      }
    });

    cancelBtn.addEventListener('click', () => {
      // Canceling the install from inside TWRP bricks the simulated device
      brickDevice("Cancelled installation in TWRP — device bricked.");
    });
  }

  // generic flasher that produces a simulated installation log then boots the chosen OS
  function flashCustomOs(osKey, parentScreen) {
    const device = document.querySelector('.device');
    if (!device) return;
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '24px';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.background = '#000';
    overlay.style.color = '#0ff';
    overlay.style.fontFamily = '"Courier New", monospace';
    overlay.style.zIndex = '140';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.padding = '16px';
    overlay.style.pointerEvents = 'auto';
    overlay.innerHTML = `
      <div class="linux-install-log" style="max-width:340px;">
        <h3>Flashing ${osKey} via TWRP...</h3>
        <pre id="customFlashLog"></pre>
      </div>
    `;
    device.appendChild(overlay);

    const logElem = overlay.querySelector('#customFlashLog');
    const steps = [
      `[*] Preparing to flash ${osKey}...`,
      "[*] Backing up current images...",
      "[*] Writing image to /dev/system...",
      "[*] Verifying image integrity...",
      "[*] Finalizing...",
      `[*] ${osKey} flash complete. Rebooting...`
    ];
    let idx = 0;
    function step() {
      if (idx < steps.length) {
        logElem.textContent += steps[idx] + "\n";
        idx++;
        setTimeout(step, 600);
      } else {
        setTimeout(() => {
          overlay.remove();
          showToast(`${formatOsName(osKey)} installed (simulated).`, 3000);
          try { localStorage.setItem('currentOS', osKey); } catch(e){}
          // After flashing, automatically boot into the new OS to make it "functional"
          // linux-mobile uses the existing installer flow for a richer experience
          if (osKey === 'linux-mobile') {
            // handled by installLinuxOs earlier
            return;
          } else {
            // show a short TWRP message then return to TWRP screen and boot the custom OS
            const twrpLog = parentScreen.querySelector('#twrpLog');
            if (twrpLog) {
              twrpLog.textContent += `\n[+] ${osKey} installed via TWRP.\n`;
            }
            // small delay to simulate reboot then boot the custom OS UI
            setTimeout(() => {
              bootCustomOs(osKey, parentScreen);
            }, 800);
          }
        }, 800);
      }
    }
    step();
  }

  // small helper to make names readable
  function formatOsName(key) {
    return key.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join(' ');
  }

  // boot a simulated custom OS UI for each supported osKey
  function bootCustomOs(osKey, parentScreen) {
    const screen = document.querySelector('.screen');
    if (!screen) return;
    // hide Android UI
    const homeScreen = document.getElementById('homeScreen');
    const appWindow = document.getElementById('appWindow');
    if (homeScreen) homeScreen.style.display = 'none';
    if (appWindow) appWindow.classList.remove('open');

    // remove existing linux/twrp screens
    const existing = document.getElementById('linuxOsScreen') || document.getElementById('twrpRecoveryScreen') || document.getElementById('linux24Desktop');
    if (existing) existing.remove();

    // create a simple boot/desktop for each custom OS with interactive terminal
    const customScreen = document.createElement('div');
    customScreen.id = 'linuxOsScreen';
    customScreen.style.position = 'absolute';
    customScreen.style.top = '24px';
    customScreen.style.left = '0';
    customScreen.style.right = '0';
    customScreen.style.bottom = '0';
    customScreen.style.background = '#03030a';
    customScreen.style.zIndex = '40';
    customScreen.style.fontFamily = '"Courier New", monospace';
    customScreen.style.color = '#0f0';
    customScreen.style.pointerEvents = 'auto';
    customScreen.innerHTML = `
      <div class="linux-status-bar">${formatOsName(osKey)} · simulated boot</div>
      <div class="linux-terminal" style="display:flex;flex-direction:column;gap:8px;padding:8px;">
        <pre id="customBootLog" style="margin:0;max-height:260px;overflow:auto;"></pre>
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="color:#0f0;">root@${osKey}:~#</span>
          <input id="customCmdInput" type="text" autocomplete="off" spellcheck="false" style="flex:1;background:transparent;border:1px solid rgba(0,255,255,0.06);color:#0f0;padding:6px;border-radius:4px;font-family:inherit;" />
          <button id="customCmdEnter" style="padding:6px 8px;border-radius:6px;border:none;background:#1976D2;color:#fff;cursor:pointer;">Run</button>
        </div>
      </div>
      <div class="linux-actions" style="gap:8px;">
        <button id="customRebootToAndroid">Reboot to Android</button>
        <button id="customShowInfo">Show Info</button>
      </div>
    `;
    screen.appendChild(customScreen);

    const bootLog = customScreen.querySelector('#customBootLog');
    const cmdInput = customScreen.querySelector('#customCmdInput');
    const cmdEnter = customScreen.querySelector('#customCmdEnter');

    const bootSequence = [
      `${formatOsName(osKey)} bootloader v1.0`,
      `Loading kernel... done`,
      `Mounting rootfs... done`,
      `Starting init...`,
      `${formatOsName(osKey)}: Welcome! This is a simulated ${formatOsName(osKey)} session.`,
      `Type 'help' for a list of commands or use the 'Show Info' button.`
    ];
    let i = 0;
    function appendBoot() {
      if (i < bootSequence.length) {
        bootLog.textContent += bootSequence[i] + '\n';
        i++;
        setTimeout(appendBoot, 300);
      } else {
        // focus input after boot sequence
        setTimeout(() => cmdInput.focus(), 200);
      }
    }
    appendBoot();

    // create a lightweight visual desktop per osKey
    function createVisualDesktop() {
      // avoid duplicates
      if (customScreen.querySelector('.custom-visual-desktop')) return;

      const desk = document.createElement('div');
      desk.className = 'custom-visual-desktop';
      desk.style.position = 'absolute';
      desk.style.top = '24px';
      desk.style.left = '0';
      desk.style.right = '0';
      desk.style.bottom = '0';
      desk.style.display = 'flex';
      desk.style.flexDirection = 'column';
      desk.style.alignItems = 'stretch';
      desk.style.justifyContent = 'flex-start';
      desk.style.zIndex = '60';
      desk.style.pointerEvents = 'auto';
      desk.style.background = (() => {
        switch(osKey) {
          case 'postmarketos': return 'linear-gradient(135deg,#0f2540 0%, #071a2a 100%)';
          case 'phoenix-osp': return 'linear-gradient(135deg,#2b1f0d 0%, #0e0b03 100%)';
          case 'privacy-os': return 'linear-gradient(135deg,#041014 0%, #021015 100%)';
          case 'androidx': return 'linear-gradient(135deg,#0b2e10 0%, #021507 100%)';
          case 'minimal-desktop': return 'linear-gradient(135deg,#15202b 0%, #0b141a 100%)';
          case 'lightweight-server': return '#000';
          default: return 'linear-gradient(135deg,#101820 0%, #051018 100%)';
        }
      })();

      // top taskbar
      const taskbar = document.createElement('div');
      taskbar.style.height = '34px';
      taskbar.style.background = 'rgba(0,0,0,0.35)';
      taskbar.style.display = 'flex';
      taskbar.style.alignItems = 'center';
      taskbar.style.justifyContent = 'space-between';
      taskbar.style.padding = '0 8px';
      taskbar.style.color = '#fff';
      taskbar.innerHTML = `<div style="display:flex;align-items:center;gap:8px;"><strong>${formatOsName(osKey)}</strong></div><div id="customClock" style="opacity:0.9">${new Date().toLocaleTimeString()}</div>`;
      desk.appendChild(taskbar);

      // main content area with icons / panels
      const main = document.createElement('div');
      main.style.flex = '1';
      main.style.display = 'flex';
      main.style.flexDirection = 'row';
      main.style.gap = '12px';
      main.style.padding = '12px';

      // left column: icon grid
      const iconsCol = document.createElement('div');
      iconsCol.style.width = '86px';
      iconsCol.style.display = 'flex';
      iconsCol.style.flexDirection = 'column';
      iconsCol.style.gap = '10px';
      iconsCol.style.alignItems = 'center';

      const makeIcon = (emoji, label) => {
        const btn = document.createElement('button');
        btn.className = 'custom-desktop-icon';
        btn.style.width = '64px';
        btn.style.height = '72px';
        btn.style.background = 'rgba(255,255,255,0.03)';
        btn.style.border = 'none';
        btn.style.borderRadius = '8px';
        btn.style.color = '#fff';
        btn.style.display = 'flex';
        btn.style.flexDirection = 'column';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.gap = '6px';
        btn.style.cursor = 'pointer';
        btn.innerHTML = `<div style="font-size:28px">${emoji}</div><div style="font-size:12px;opacity:0.9">${label}</div>`;
        return btn;
      };

      // create different sets per osKey
      const iconSet = (() => {
        switch(osKey) {
          case 'postmarketos':
            return [
              makeIcon('📁','Files'),
              makeIcon('🌐','Web'),
              makeIcon('⚙️','Settings'),
              makeIcon('🖥️','Terminal')
            ];
          case 'phoenix-osp':
            return [
              makeIcon('▶️','Launcher'),
              makeIcon('📦','Apps'),
              makeIcon('🛠️','System'),
              makeIcon('🖼️','Gallery')
            ];
          case 'privacy-os':
            return [
              makeIcon('🛡️','Vault'),
              makeIcon('🔒','Firewall'),
              makeIcon('📡','Network'),
              makeIcon('🧾','Logs')
            ];
          case 'androidx':
            return [
              makeIcon('🏠','Home'),
              makeIcon('📱','Play'),
              makeIcon('⚙️','Settings'),
              makeIcon('📥','Store')
            ];
          case 'minimal-desktop':
            return [
              makeIcon('📂','Files'),
              makeIcon('📝','Editor'),
              makeIcon('🔎','Search'),
              makeIcon('💻','Terminal')
            ];
          case 'lightweight-server':
            return [
              makeIcon('🖥️','Services'),
              makeIcon('⚙️','Config'),
              makeIcon('📊','Metrics'),
              makeIcon('🔧','Tools')
            ];
          default:
            return [
              makeIcon('📁','Files'),
              makeIcon('🌐','Web'),
              makeIcon('🖥️','Terminal'),
              makeIcon('⚙️','Settings')
            ];
        }
      })();

      iconSet.forEach(ic => iconsCol.appendChild(ic));
      main.appendChild(iconsCol);

      // right area: focus window panel
      const panel = document.createElement('div');
      panel.style.flex = '1';
      panel.style.background = 'rgba(0,0,0,0.25)';
      panel.style.borderRadius = '10px';
      panel.style.padding = '12px';
      panel.style.color = '#fff';
      panel.style.overflow = 'auto';
      panel.innerHTML = `<h3 style="margin-top:0">${formatOsName(osKey)}</h3><p style="opacity:0.9">Interactive panel — click icons to view mini-apps.</p><div id="panelContent" style="margin-top:8px;"></div>`;
      main.appendChild(panel);

      desk.appendChild(main);

      // bottom mini task area for actions
      const bottomBar = document.createElement('div');
      bottomBar.style.height = '44px';
      bottomBar.style.background = 'rgba(0,0,0,0.35)';
      bottomBar.style.display = 'flex';
      bottomBar.style.alignItems = 'center';
      bottomBar.style.justifyContent = 'flex-end';
      bottomBar.style.padding = '0 8px';
      bottomBar.style.gap = '8px';
      bottomBar.innerHTML = `<button id="customOpenTerminal" style="background:#1976D2;border:none;color:#fff;padding:6px 8px;border-radius:6px;cursor:pointer;">Terminal</button><button id="customLogout" style="background:#b71c1c;border:none;color:#fff;padding:6px 8px;border-radius:6px;cursor:pointer;">Reboot</button>`;
      desk.appendChild(bottomBar);

      customScreen.appendChild(desk);

      // clock updater
      const clockElem = desk.querySelector('#customClock');
      function updateClock() {
        if (!clockElem) return;
        const now = new Date();
        clockElem.textContent = now.toLocaleTimeString();
      }
      updateClock();
      const ci = setInterval(updateClock, 60000);

      // panel content loader per icon
      const panelContent = desk.querySelector('#panelContent');
      iconSet.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          const labels = ['Files','Web','Terminal','Settings'];
          const label = btn.textContent.trim();
          // simple mapping for content
          panelContent.innerHTML = '';
          if (label.includes('Files') || label === 'Files') {
            panelContent.innerHTML = `<div style="background:rgba(0,0,0,0.35);padding:8px;border-radius:6px;"><strong>Files</strong><ul style="margin:6px 0 0 14px;opacity:0.9;"><li>Documents/</li><li>Downloads/</li><li>Pictures/</li><li>README-${osKey}.txt</li></ul></div>`;
          } else if (label.includes('Web') || label === 'Web') {
            panelContent.innerHTML = `<div style="background:rgba(0,0,0,0.35);padding:8px;border-radius:6px;"><strong>Browser</strong><p style="opacity:0.9">You are offline — this is a simulated browser for ${formatOsName(osKey)}.</p></div>`;
          } else if (label.includes('Terminal') || label === 'Terminal' || label === '_') {
            panelContent.innerHTML = `<div style="background:rgba(0,0,0,0.35);padding:8px;border-radius:6px;"><strong>Mini Terminal</strong><pre style="background:#000;padding:8px;border-radius:6px;max-height:120px;overflow:auto;font-family:inherit;">$ uname -a\nLinux ${osKey}-sim 5.15.0-sim #1 SMP PREEMPT\n$ echo "Welcome to ${formatOsName(osKey)} GUI"</pre></div>`;
          } else if (label.includes('Settings') || label === 'Settings') {
            panelContent.innerHTML = `<div style="background:rgba(0,0,0,0.35);padding:8px;border-radius:6px;"><strong>Settings</strong><p style="opacity:0.9">Brightness, Network, Security (simulated).</p></div>`;
          } else if (label.includes('Launcher') || label.includes('Apps')) {
            panelContent.innerHTML = `<div style="background:rgba(0,0,0,0.35);padding:8px;border-radius:6px;"><strong>Apps</strong><p style="opacity:0.8">Sample apps: Calculator, Notes, Gallery (simulated)</p></div>`;
          } else if (label.includes('Vault') || label.includes('Firewall')) {
            panelContent.innerHTML = `<div style="background:rgba(0,0,0,0.35);padding:8px;border-radius:6px;"><strong>Privacy Tools</strong><p style="opacity:0.9">Firewall and privacy controls (simulated).</p></div>`;
          } else {
            panelContent.innerHTML = `<div style="background:rgba(0,0,0,0.35);padding:8px;border-radius:6px;"><p style="opacity:0.9">Simulated panel for ${label}</p></div>`;
          }
        });
      });

      // bottom buttons
      desk.querySelector('#customOpenTerminal').addEventListener('click', () => {
        // remove visual desktop and show terminal area again
        const term = customScreen.querySelector('.linux-terminal');
        if (term) term.style.display = 'flex';
        desk.remove();
      });
      desk.querySelector('#customLogout').addEventListener('click', () => {
        clearInterval(ci);
        customScreen.remove();
        showToast('Rebooting to Android 1.0 Sim...');
        if (homeScreen) { homeScreen.style.display = 'grid'; homeScreen.style.opacity = '1'; }
      });

      // close desktop when parent removed
      customScreen.addEventListener('DOMNodeRemoved', () => {
        desk.remove();
      });
    }

    // Simple command handler for custom OS sessions
    function handleCustomCommand(cmd) {
      if (!cmd) {
        bootLog.textContent += `\n`;
        return;
      }
      const parts = cmd.trim().split(' ');
      const base = parts[0].toLowerCase();
      switch(base) {
        case 'help':
          bootLog.textContent += "\nAvailable commands: help, info, ls, uname -a, clear, start, reboot, gui\n";
          break;
        case 'info':
          bootLog.textContent += `\n--- ${formatOsName(osKey)} Info ---\n`;
          switch (osKey) {
            case 'minimal-desktop':
              bootLog.textContent += "Mode: Minimal Desktop\nPackages: busybox, simplewm\nTarget: Lightweight UI\n";
              break;
            case 'lightweight-server':
              bootLog.textContent += "Mode: Server\nServices: sshd (simulated), httpd (simulated)\nTarget: Headless operations\n";
              break;
            case 'postmarketos':
              bootLog.textContent += "Mode: Mobile (postmarketOS-like)\nNotes: Optimized for phones (simulated)\n";
              break;
            case 'phoenix-osp':
              bootLog.textContent += "Mode: Android-x86-like environment\nIncludes: Android runtime (simulated)\n";
              break;
            case 'androidx':
              bootLog.textContent += "Mode: Android fork\nFeatures: Custom launcher, root access (simulated)\n";
              break;
            case 'privacy-os':
              bootLog.textContent += "Mode: Hardened Privacy OS\nFeatures: firewall, limited telemetry (simulated)\n";
              break;
            default:
              bootLog.textContent += "Generic custom OS - simulated info.\n";
              break;
          }
          break;
        case 'ls':
          bootLog.textContent += "\nbin  boot  etc  home  var  tmp  README.txt\n";
          break;
        case 'uname':
        case 'uname -a':
          bootLog.textContent += `\nLinux ${osKey}-sim 5.15.0-sim #1 SMP PREEMPT\n`;
          break;
        case 'clear':
          bootLog.textContent = "";
          break;
        case 'start':
          bootLog.textContent += `\nStarting ${formatOsName(osKey)} desktop (simulated)...\n`;
          createVisualDesktop();
          break;
        case 'gui':
          bootLog.textContent += `\nLaunching GUI for ${formatOsName(osKey)}...\n`;
          createVisualDesktop();
          break;
        case 'reboot':
          bootLog.textContent += "\nRebooting to Android 1.0 Sim...\n";
          setTimeout(() => {
            customScreen.remove();
            if (homeScreen) { homeScreen.style.display = 'grid'; homeScreen.style.opacity = '1'; }
          }, 700);
          break;
        default:
          bootLog.textContent += `\n${base}: command not found\n`;
          break;
      }
      // scroll to bottom
      const term = customScreen.querySelector('.linux-terminal');
      if (term) term.scrollTop = term.scrollHeight;
    }

    // bind enter keys and run button
    cmdInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const v = cmdInput.value.trim();
        bootLog.textContent += `root@${osKey}:~# ${v}\n`;
        handleCustomCommand(v);
        cmdInput.value = '';
      }
    });
    cmdEnter.addEventListener('click', () => {
      const v = cmdInput.value.trim();
      bootLog.textContent += `root@${osKey}:~# ${v}\n`;
      handleCustomCommand(v);
      cmdInput.value = '';
    });

    // action buttons
    customScreen.querySelector('#customRebootToAndroid').addEventListener('click', () => {
      showToast('Rebooting to Android 1.0 Sim...');
      customScreen.remove();
      currentOS = 'Android';
      if (homeScreen) {
        homeScreen.style.display = 'grid';
        homeScreen.style.opacity = '1';
      }
    });

    customScreen.querySelector('#customShowInfo').addEventListener('click', () => {
      handleCustomCommand('info');
    });

    // auto-open a small GUI shortly after boot for a visual experience
    setTimeout(() => {
      createVisualDesktop();
      // hide terminal for clarity
      const termElem = customScreen.querySelector('.linux-terminal');
      if (termElem) termElem.style.display = 'none';
    }, 800);
  }

  // New: brick the simulated device (persistent)
  function brickDevice(message) {
    try { localStorage.setItem('deviceBricked', 'true'); } catch (e) {}
    // remove interactive overlays / screens
    const device = document.querySelector('.device');
    if (!device) return;
    // hide internal UI
    const bootloader = document.getElementById('bootloaderOverlay');
    if (bootloader) bootloader.remove();
    const twrp = document.getElementById('twrpRecoveryScreen');
    if (twrp) twrp.remove();
    const linux = document.getElementById('linuxOsScreen');
    if (linux) linux.remove();
    const laptop = document.getElementById('laptopInstallerOverlay');
    if (laptop) laptop.remove();
    
    // create a persistent brick overlay that cannot be dismissed
    let brick = document.getElementById('brickOverlay');
    if (!brick) {
      brick = document.createElement('div');
      brick.id = 'brickOverlay';
      brick.style.position = 'absolute';
      brick.style.top = '0';
      brick.style.left = '0';
      brick.style.right = '0';
      brick.style.bottom = '0';
      brick.style.background = '#000';
      brick.style.color = '#FF3B30';
      brick.style.display = 'flex';
      brick.style.flexDirection = 'column';
      brick.style.justifyContent = 'center';
      brick.style.alignItems = 'center';
      brick.style.zIndex = '9999';
      brick.style.fontFamily = '"Courier New", monospace';
      brick.style.padding = '20px';
      brick.style.whiteSpace = 'pre-wrap';
      brick.innerHTML = `
        <div style="font-size:1.2em;font-weight:800;margin-bottom:12px;">DEVICE BRICKED</div>
        <div style="max-width:86%;text-align:center;opacity:0.95;">${message || 'The device is permanently bricked (simulated).'}<br><br>Factory restore required.</div>
        <div style="margin-top:16px;">
          <button id="brickFactoryResetBtn" style="padding:10px 14px;border-radius:8px;border:none;background:#0b8043;color:#fff;font-weight:700;cursor:pointer;">Factory Reset</button>
        </div>
      `;
      device.appendChild(brick);
    }
    
    // visually mark device; disable pointer events on device internals but keep the brick overlay interactive
    // avoid disabling document.body pointer events so the brick button remains clickable
    device.style.pointerEvents = 'none';
    brick.style.pointerEvents = 'auto';
    
    // attach factory reset handler on the button inside the brick overlay
    const brickBtn = document.getElementById('brickFactoryResetBtn');
    if (brickBtn) {
      brickBtn.addEventListener('click', (e) => {
        // stop propagation so nothing else accidentally handles the click
        e.stopPropagation();
        // confirm then perform factory reset
        const ok = confirm("Factory Reset will clear simulation state and reload the page. Proceed?");
        if (ok) {
          // clear brick flag so factory reset succeeds
          try { localStorage.removeItem('deviceBricked'); } catch (err) {}
          factoryReset();
        } else {
          showToast("Factory reset cancelled");
        }
      });
    }

    // update toast and any stateful UI
    showToast('Device bricked (simulation).', 5000);
  }
  
  // On load, if previously bricked, re-apply brick overlay
  try {
    if (localStorage.getItem('deviceBricked') === 'true') {
      setTimeout(() => brickDevice("Device previously bricked (persistent simulation)."), 80);
    }
  } catch(e) {}

  // Delegated click handlers for dynamically created buttons (fixes cases where overlays or dynamic insertion prevented handlers)
  document.addEventListener('click', (e) => {
    // twrp custom list buttons
    const twrpBtn = e.target.closest('.twrp-os-btn');
    if (twrpBtn) {
      // try to locate the TWRP parent screen
      const twrpScreen = document.getElementById('twrpRecoveryScreen');
      const osKey = twrpBtn.dataset.os;
      const dialog = twrpBtn.closest('#twrpCustomList');
      if (dialog) dialog.remove();
      if (!osKey || osKey === 'cancel') {
        showToast('Cancelled');
        return;
      }
      showToast(`Selected: ${osKey}`);
      if (osKey === 'linux-mobile') {
        installLinuxOs();
      } else {
        flashCustomOs(osKey, twrpScreen || document.querySelector('.screen'));
      }
      return;
    }

    // global download buttons (Google Play) - fallback
    const dlBtn = e.target.closest('.download-button');
    if (dlBtn) {
      const appName = dlBtn.parentElement ? dlBtn.parentElement.querySelector('span')?.textContent : 'App';
      // reuse existing behavior: randomly download or infect
      if (Math.random() < 0.5) {
        dlBtn.textContent = "Downloading...";
        setTimeout(() => {
          dlBtn.textContent = "Downloaded";
          showToast((appName || "App") + " downloaded!");
        }, 1000);
      } else {
        const virusNames = ["WormX", "TrojanX", "SpywareZ", "RansomY", "AdwareV"];
        const virusName = virusNames[Math.floor(Math.random() * virusNames.length)];
        dlBtn.textContent = "Infecting...";
        setTimeout(() => {
          dlBtn.textContent = "Virus " + virusName;
          runVirusInstallation(virusName);
        }, 1000);
      }
      return;
    }

    // delegated handlers for custom gui buttons
    if (e.target.closest('.close-gui')) {
      const gui = e.target.closest('.custom-gui-window');
      if (gui) gui.remove();
      return;
    }
    if (e.target.closest('.launch-app')) {
      const parentScreen = e.target.closest('#linuxOsScreen') || e.target.closest('.device') || document;
      const log = parentScreen.querySelector('#customBootLog');
      if (log) log.textContent += `\n[GUI] Launched sample app (simulated)\n`;
    }
  });
});