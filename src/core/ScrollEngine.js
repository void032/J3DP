import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function createScrollEngine({ cameraRig, textLayer, sceneManager, fogController }) {
  ScrollTrigger.create({
    trigger: '#scroll-driver',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const p = self.progress;  // 0 → 1

      // Drive camera
      if (cameraRig) cameraRig.setProgress(p);

      // Drive text overlay
      if (textLayer) textLayer.update(p);

      // Drive fog + lighting per scene
      if (fogController && sceneManager) {
        fogController.update(p, sceneManager.scene, sceneManager.renderer);
      }
    },
  });
}
