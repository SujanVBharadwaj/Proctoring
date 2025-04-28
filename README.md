
**ONLINE TEST PROCTORING SYSTEM**

This project is a browser-based monitoring system for online tests, ensuring the integrity of remote examinations. It detects suspicious behaviors like:

Loud sounds (continuous noise)

No person detected on camera

Tab switching, window minimizing, or resizing

Right-clicking or using keyboard shortcuts (like Ctrl+C, Alt+Tab, F12)

Unusual mouse activity

Mouse inactivity

The system automatically logs violations, captures screenshots when necessary, and can terminate the test if too many violations occur.
-----------------------------------------------------------------------------------------------------------------------------------------------

**Features**
🎥 Camera Monitoring: Detects if a user is present via webcam (using MediaPipe Pose).

🎤 Microphone Monitoring: Monitors ambient noise for loud sounds.

🖱️ Mouse Monitoring: Tracks inactivity and unusual activity levels.

🌐 Browser Event Monitoring: Detects tab switches, context menu usage, forbidden shortcuts, window blurring, and resizing.

📸 Screenshot Capture: Takes a screenshot whenever a violation is recorded.

📝 Violation Logging: Displays a list of all recorded violations at the end of the test.

-------------------------------------------------------------------------------------------------------------------------------------------------------------

**Permissions**
The app will request access to:

Camera: For user detection.

Microphone: For loud sound detection.

Without granting access, the system cannot function properly.

--------------------------------------------------------------------------------------------------------------------------------------------------------------

**Technology Stack**

HTML5 + CSS3 + JavaScript

MediaPipe Pose by Google (for webcam pose detection)

Web Audio API (for microphone sound analysis)

Canvas API (for screenshots and overlays)

**SCREENSHOTS**

![image](https://github.com/user-attachments/assets/c6f6e228-c555-4cb4-a410-2e0ad8af929a)


![image](https://github.com/user-attachments/assets/49cde7e7-2212-4f7b-83e0-22d54c8b4117)

![image](https://github.com/user-attachments/assets/629d88cc-a856-4bff-a07b-8970e21d60bd)



