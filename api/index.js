const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/download', (req, res) => {
  const videoURL = req.query.url;
  const type = req.query.type || 'video';

  if (!videoURL) {
    return res.status(400).send('No video URL provided');
  }

  const format = type === 'audio' ? 'bestaudio' : 'bestvideo';

  try {
    // Spawn yt-dlp to download the video/audio
    const ytProcess = spawn('yt-dlp', ['-f', format, '-o', '-', videoURL]);

    // Set headers for file download
    const contentType = type === 'audio' ? 'audio/mpeg' : 'video/mp4';
    const fileExtension = type === 'audio' ? 'mp3' : 'mp4';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="download.${fileExtension}"`);

    // Stream the output directly to the client
    ytProcess.stdout.pipe(res);

    ytProcess.stderr.on('data', (data) => {
      console.error(`yt-dlp stderr: ${data}`);
    });

    ytProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Download completed successfully.');
      } else {
        console.error(`yt-dlp exited with code ${code}`);
        res.status(500).send('Download failed.');
      }
    });

    ytProcess.on('error', (err) => {
      console.error('Error during yt-dlp process:', err);
      res.status(500).send('Error downloading the video.');
    });
  } catch (error) {
    console.error('Error starting download process:', error);
    res.status(500).send('Failed to start download process.');
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
