import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { publicPath } from './utils/publicPath';
import './index.css';

// 添加鼠标跟随效果
const createCursorFollower = () => {
  const follower = document.createElement('div');
  follower.className = 'cursor-follower';
  document.body.appendChild(follower);

  let mouseX = 0;
  let mouseY = 0;
  let posX = 0;
  let posY = 0;
  const speed = 0.2;

  const updatePosition = () => {
    const dx = mouseX - posX;
    const dy = mouseY - posY;
    
    posX += dx * speed;
    posY += dy * speed;
    
    follower.style.left = `${posX}px`;
    follower.style.top = `${posY}px`;
    
    requestAnimationFrame(updatePosition);
  };

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // 检查是否支持 prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    follower.style.display = 'none';
  } else {
    updatePosition();
  }
};


const applyPublicAssetVariables = () => {
  const root = document.documentElement;
  root.style.setProperty(
    "--app-body-bg-light",
    `url("${publicPath("pictures/ink-wash-light.svg")}") center/cover no-repeat, radial-gradient(circle at 14% 12%, rgba(201, 167, 122, 0.14), transparent 24%), radial-gradient(circle at 84% 18%, rgba(180, 145, 110, 0.10), transparent 18%), radial-gradient(circle at 22% 78%, rgba(147, 178, 160, 0.08), transparent 18%), radial-gradient(circle at 80% 74%, rgba(201, 167, 122, 0.08), transparent 16%), linear-gradient(180deg, #fdf9f3 0%, #f9f2e8 25%, #f3eadc 60%, #ede2d2 100%)`,
  );
  root.style.setProperty(
    "--app-body-bg-dark",
    `url("${publicPath("pictures/ink-wash-light.svg")}") center/cover no-repeat, radial-gradient(circle at 14% 12%, rgba(201, 137, 77, 0.20), transparent 22%), radial-gradient(circle at 84% 18%, rgba(143, 71, 33, 0.18), transparent 18%), radial-gradient(circle at 22% 78%, rgba(95, 142, 123, 0.16), transparent 18%), radial-gradient(circle at 80% 74%, rgba(120, 165, 144, 0.12), transparent 16%), linear-gradient(180deg, #1b130d 0%, #231912 28%, #261b14 68%, #201710 100%)`,
  );
  root.style.setProperty(
    "--origin-section-bg",
    `linear-gradient(180deg, rgba(255, 250, 244, 0.55) 0%, rgba(255, 250, 244, 0.38) 40%, rgba(255, 250, 244, 0.55) 100%), url("${publicPath("pictures/origin-bg.jpg")}") center/cover no-repeat`,
  );
  root.style.setProperty(
    "--story-section-origin-bg",
    `linear-gradient(180deg, rgba(255, 250, 244, 0.48) 0%, rgba(255, 250, 244, 0.3) 40%, rgba(255, 250, 244, 0.48) 100%), url("${publicPath("pictures/origin-bg.png")}") center/cover no-repeat`,
  );
  root.style.setProperty(
    "--story-section-dynasty-bg",
    `linear-gradient(180deg, rgba(255, 250, 244, 0.5), rgba(245, 236, 224, 0.48)), radial-gradient(circle at 18% 24%, rgba(201, 137, 77, 0.1), transparent 22%), radial-gradient(circle at 82% 74%, rgba(95, 142, 123, 0.08), transparent 18%), url("${publicPath("pictures/section-01.jpg")}") center center/cover no-repeat`,
  );
  root.style.setProperty(
    "--story-section-map-bg",
    `linear-gradient(180deg, rgba(251, 247, 240, 0.5), rgba(241, 233, 221, 0.46)), radial-gradient(circle at 14% 20%, rgba(95, 142, 123, 0.12), transparent 20%), radial-gradient(circle at 86% 78%, rgba(201, 137, 77, 0.12), transparent 18%), url("${publicPath("pictures/section-02.jpg")}") center center/cover no-repeat`,
  );
  root.style.setProperty(
    "--story-section-theater-bg",
    `linear-gradient(180deg, rgba(255, 249, 241, 0.52), rgba(243, 232, 220, 0.48)), radial-gradient(circle at 22% 18%, rgba(167, 125, 78, 0.12), transparent 20%), radial-gradient(circle at 76% 72%, rgba(143, 71, 33, 0.1), transparent 22%), url("${publicPath("pictures/section-03.jpg")}") center center/cover no-repeat`,
  );
  root.style.setProperty(
    "--story-section-trajectory-bg",
    `linear-gradient(180deg, rgba(250, 246, 239, 0.54), rgba(236, 227, 214, 0.48)), radial-gradient(circle at 18% 76%, rgba(95, 142, 123, 0.1), transparent 20%), radial-gradient(circle at 84% 18%, rgba(201, 137, 77, 0.1), transparent 18%), url("${publicPath("pictures/section-04.jpg")}") center center/cover no-repeat`,
  );
  root.style.setProperty(
    "--story-section-methodology-bg",
    `linear-gradient(180deg, rgba(255, 251, 245, 0.58), rgba(240, 230, 216, 0.52)), radial-gradient(circle at 22% 22%, rgba(143, 71, 33, 0.08), transparent 18%), radial-gradient(circle at 78% 76%, rgba(95, 142, 123, 0.08), transparent 18%), url("${publicPath("pictures/section-05.jpg")}") center center/cover no-repeat`,
  );
  root.style.setProperty(
    "--story-section-outro-bg",
    `linear-gradient(180deg, rgba(255, 249, 242, 0.52), rgba(236, 224, 208, 0.46)), radial-gradient(circle at 18% 18%, rgba(201, 137, 77, 0.1), transparent 20%), radial-gradient(circle at 82% 82%, rgba(95, 142, 123, 0.08), transparent 18%), url("${publicPath("pictures/section-02.jpg")}") center 58%/cover no-repeat`,
  );
};

applyPublicAssetVariables();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// 初始化鼠标跟随效果
createCursorFollower();
