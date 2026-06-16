export const MouseParallax = {
  create(cameraRig) {
    let mouseX = 0;
    let mouseY = 0;

    // Optional uniform to sync mouse to shader
    let shaderUniform = null;

    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;

      if (cameraRig && cameraRig.setMouseOffset) {
        cameraRig.setMouseOffset(mouseX, mouseY);
      }

      if (shaderUniform) {
        shaderUniform.value.set(mouseX, mouseY);
      }
    });

    return {
      setShaderUniform(uniform) {
        shaderUniform = uniform;
      }
    };
  }
};
