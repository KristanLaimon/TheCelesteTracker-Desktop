<div class="snow-container">
  <div class="snow"></div>
</div>

<style>
  .snow-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: -1;
    overflow: hidden;
  }

  .snow {
    width: 3px;
    height: 3px;
    background: white;
    border-radius: 50%;
    box-shadow: 
      20vw 10vh 2px white,
      40vw 30vh 2px white,
      60vw 20vh 2px white,
      80vw 40vh 2px white,
      10vw 60vh 2px white,
      30vw 80vh 2px white,
      50vw 70vh 2px white,
      70vw 90vh 2px white,
      90vw 50vh 2px white,
      25vw 25vh 1px rgba(255, 255, 255, 0.7),
      75vw 75vh 1px rgba(255, 255, 255, 0.7),
      15vw 85vh 1px rgba(255, 255, 255, 0.7),
      85vw 15vh 1px rgba(255, 255, 255, 0.7);
    animation: snow-fall 10s linear infinite;
    opacity: 0.3;
  }

  .snow::after {
    content: '';
    position: absolute;
    top: -100vh;
    left: 0;
    width: 100%;
    height: 100%;
    box-shadow: inherit;
  }

  @keyframes snow-fall {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(100vh);
    }
  }
</style>
