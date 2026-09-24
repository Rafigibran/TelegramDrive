import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const configPath = path.join(repoRoot, 'app', 'src-tauri', 'tauri.conf.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const identifier = config.identifier;

if (!identifier) {
  throw new Error('Tauri identifier is missing from tauri.conf.json');
}

const androidRoot = path.join(repoRoot, 'app', 'src-tauri', 'gen', 'android');
const manifestPath = path.join(androidRoot, 'app', 'src', 'main', 'AndroidManifest.xml');

if (!fs.existsSync(manifestPath)) {
  throw new Error(`AndroidManifest.xml not found: ${manifestPath}. Run "tauri android init --ci" first.`);
}

const packagePath = identifier.split('.').join(path.sep);
const javaDir = path.join(androidRoot, 'app', 'src', 'main', 'java', packagePath);
fs.mkdirSync(javaDir, { recursive: true });

const servicePath = path.join(javaDir, 'UploadForegroundService.kt');
const serviceSource = `package ${identifier}

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder

class UploadForegroundService : Service() {
    companion object {
        private const val CHANNEL_ID = "telegram_drive_uploads"
        private const val NOTIFICATION_ID = 14201

        @JvmStatic
        fun startService(context: Context) {
            val intent = Intent(context, UploadForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        @JvmStatic
        fun stopService(context: Context) {
            context.stopService(Intent(context, UploadForegroundService::class.java))
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()

        val notification = Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("Telegram Drive")
            .setContentText("Uploads are active in the background")
            .setSmallIcon(android.R.drawable.stat_sys_upload)
            .setOngoing(true)
            .setCategory(Notification.CATEGORY_PROGRESS)
            .build()

        startForeground(NOTIFICATION_ID, notification)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onDestroy() {
        stopForeground(STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val manager = getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Uploads",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Keeps Telegram Drive uploads active while the app is in the background"
        }

        manager.createNotificationChannel(channel)
    }
}
`;

fs.writeFileSync(servicePath, serviceSource);

let manifest = fs.readFileSync(manifestPath, 'utf8');

const permissions = [
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_DATA_SYNC'
];

for (const permission of permissions) {
  const tag = `    <uses-permission android:name="${permission}" />`;
  if (!manifest.includes(`android:name="${permission}"`)) {
    manifest = manifest.replace(/<manifest([^>]*)>/, '<manifest$1>\\n' + tag);
  }
}

const serviceEntry = `        <service
            android:name=".UploadForegroundService"
            android:exported="false"
            android:foregroundServiceType="dataSync" />`;

if (!manifest.includes('android:name=".UploadForegroundService"')) {
  manifest = manifest.replace('</application>', serviceEntry + '\\n    </application>');
}

fs.writeFileSync(manifestPath, manifest);
console.log(`Prepared Android foreground upload service for ${identifier}`);
