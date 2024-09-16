const manifestUri = 'http://192.168.10.75:8888/stream/index.m3u8';
let retryInterval = null;

function initApp() {
  // Установка встроенных полифиллов для устранения несовместимостей браузера.
  shaka.polyfill.installAll();

  // Проверка, поддерживает ли браузер необходимые API.
  if (shaka.Player.isBrowserSupported()) {
    // Все выглядит хорошо!
    initPlayer();
  } else {
    // Этот браузер не поддерживает минимальный набор необходимых API.
    console.error('Browser not supported!');
  }
}

async function initPlayer() {
  // Создание экземпляра Player.
  const video = document.getElementById('video');
  const player = new shaka.Player(video);
  player.configure({
    streaming: {
      bufferingGoal: 180,
      rebufferingGoal: 5,
      addSeekBar: false,
      addBigPlayButton: false,
      controlPanelElements: [],
    },
  });

  // Присоединение плеера к видео элементу.
  await player.attach(video);
  video.play(); // Автоматическое начало воспроизведения видео

  // Присоединение плеера к window для удобства доступа в JS-консоли.
  window.player = player;

  // Слушаем события ошибок.
  player.addEventListener('error', onErrorEvent);

  // Попытка загрузить манифест.
  // Это асинхронный процесс.
  try {
    await player.load(manifestUri);
    console.log('The video has now been loaded!');
  } catch (e) {
    onError(e);
  }
}

function onErrorEvent(event) {
  onError(event.detail);
}

function onError(error) {
  console.error('Error code', error.code, 'object', error);

  const retryErrorCodes = [1001, 1002, 1003, 1004, 1006, 1007, 1008, 1009, 1010, 2000, 2001, 2003, 2004, 3008, 3014, 3015, 3016, 3017, 4000, 4001, 4002, 4003, 4004, 4005, 4006, 4007];

  if (retryErrorCodes.includes(error.code)) {
    console.log('Retrying due to error code:', error.code);
    startRetrying();
  }
}

function startRetrying() {
  if (retryInterval === null) {
    retryInterval = setInterval(async () => {
      try {
        console.log('Attempting to reload stream...');
        await player.load(manifestUri);
        console.log('Stream reloaded successfully.');
        clearInterval(retryInterval);
        retryInterval = null;
      } catch (e) {
        console.error('Retry failed', e);
      }
    }, 5000); // Попытка перезапуска каждые 5 секунд
  }
}

document.addEventListener('DOMContentLoaded', initApp);
