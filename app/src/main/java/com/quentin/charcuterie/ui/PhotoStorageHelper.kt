package com.quentin.charcuterie.ui

import android.app.Application
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

internal object PhotoStorageHelper {

    fun creerUriPhotoCamera(app: Application): Uri {
        val cacheDir = File(app.cacheDir, "camera_temp").apply { mkdirs() }
        val tempFile = File(cacheDir, "cam_${System.currentTimeMillis()}.jpg")
        return FileProvider.getUriForFile(app, "${app.packageName}.fileprovider", tempFile)
    }

    fun compresserEtEnregistrerPhoto(app: Application, etapeId: Long, sourceUri: Uri): File? {
        val resolver = app.contentResolver
        val maxDim = 1400
        return runCatching {
            val boundsOpts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            resolver.openInputStream(sourceUri)?.use { BitmapFactory.decodeStream(it, null, boundsOpts) }
            val origW = boundsOpts.outWidth
            val origH = boundsOpts.outHeight
            if (origW <= 0 || origH <= 0) return null

            var sampleSize = 1
            while (origW / sampleSize > maxDim * 2 || origH / sampleSize > maxDim * 2) {
                sampleSize *= 2
            }

            val decodeOpts = BitmapFactory.Options().apply { inSampleSize = sampleSize }
            val decoded = resolver.openInputStream(sourceUri)?.use {
                BitmapFactory.decodeStream(it, null, decodeOpts)
            } ?: return null

            val rotationDeg = resolver.openInputStream(sourceUri)?.use { stream ->
                val exif = ExifInterface(stream)
                when (exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)) {
                    ExifInterface.ORIENTATION_ROTATE_90 -> 90f
                    ExifInterface.ORIENTATION_ROTATE_180 -> 180f
                    ExifInterface.ORIENTATION_ROTATE_270 -> 270f
                    else -> 0f
                }
            } ?: 0f

            val rotated = if (rotationDeg != 0f) {
                val matrix = Matrix().apply { postRotate(rotationDeg) }
                Bitmap.createBitmap(decoded, 0, 0, decoded.width, decoded.height, matrix, true).also {
                    if (it !== decoded) decoded.recycle()
                }
            } else {
                decoded
            }

            val w = rotated.width
            val h = rotated.height
            val finalBmp = if (w > maxDim || h > maxDim) {
                val scale = maxDim.toFloat() / maxOf(w, h).toFloat()
                val newW = (w * scale).toInt().coerceAtLeast(1)
                val newH = (h * scale).toInt().coerceAtLeast(1)
                Bitmap.createScaledBitmap(rotated, newW, newH, true).also {
                    if (it !== rotated) rotated.recycle()
                }
            } else {
                rotated
            }

            val dir = File(app.filesDir, "etape_photos").apply { mkdirs() }
            val outFile = File(dir, "etape_${etapeId}_${System.currentTimeMillis()}_${UUID.randomUUID().toString().take(6)}.jpg")
            FileOutputStream(outFile).use { fos ->
                finalBmp.compress(Bitmap.CompressFormat.JPEG, 80, fos)
            }
            finalBmp.recycle()
            outFile
        }.getOrNull()
    }

    fun supprimerFichierPhoto(cheminFichier: String) {
        runCatching { File(cheminFichier).delete() }
    }
}
