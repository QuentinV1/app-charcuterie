package com.quentin.charcuterie.notifications

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.quentin.charcuterie.MainActivity
import com.quentin.charcuterie.data.AppDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val pendingResult = goAsync()
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val dao = AppDatabase.getInstance(context).dao()
                    val now = System.currentTimeMillis()
                    val projetsById = dao.getAllProjetsOnce().associateBy { it.id }
                    val etapesActives = dao.getEtapesAvecRappelActif()
                    etapesActives.filter { it.debutPrevuMillis > now }.forEach { etape ->
                        val nomProjet = projetsById[etape.projetId]?.nom ?: "L'Affinoir"
                        planifierRappel(
                            context = context,
                            etapeId = etape.id,
                            timestampMillis = etape.debutPrevuMillis,
                            titre = "$nomProjet · ${etape.titre}",
                            message = etape.instructions.lines().firstOrNull() ?: etape.titre
                        )
                    }
                } finally {
                    pendingResult.finish()
                }
            }
            return
        }

        val titre = intent.getStringExtra("TITRE") ?: "Étape de charcuterie"
        val message = intent.getStringExtra("MESSAGE") ?: "Il est temps de passer à l'étape suivante !"
        val notifId = intent.getIntExtra("NOTIF_ID", 1001)

        val channelId = "charcuterie_rappels"
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Rappels L'Affinoir",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Rappels pour les étapes de salage, dessalage, fumage et pesées"
            }
            nm.createNotificationChannel(channel)
        }

        val openIntent = Intent(context, MainActivity::class.java)
        val pendingOpen = PendingIntent.getActivity(
            context,
            notifId,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(titre)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingOpen)
            .setAutoCancel(true)
            .build()

        nm.notify(notifId, notification)
    }

    companion object {
        fun planifierRappel(
            context: Context,
            etapeId: Long,
            timestampMillis: Long,
            titre: String,
            message: String
        ) {
            val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, ReminderReceiver::class.java).apply {
                putExtra("TITRE", titre)
                putExtra("MESSAGE", message)
                putExtra("NOTIF_ID", etapeId.toInt())
            }
            val pending = PendingIntent.getBroadcast(
                context,
                etapeId.toInt(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val triggerAt = maxOf(System.currentTimeMillis() + 5_000L, timestampMillis)
            try {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending)
            } catch (_: SecurityException) {
                am.set(AlarmManager.RTC_WAKEUP, triggerAt, pending)
            }
        }

        fun annulerRappel(context: Context, etapeId: Long) {
            val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, ReminderReceiver::class.java)
            val pending = PendingIntent.getBroadcast(
                context,
                etapeId.toInt(),
                intent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            )
            if (pending != null) {
                am.cancel(pending)
                pending.cancel()
            }
        }
    }
}
