/**
 * Extends the original Token.drawBars() with custom bar rendering. 
 *  The original function is not called. If available, the libWrapper module is
 *  used for better compatibility.
 */
export const extendBarRenderer = function () {
  // if (game.modules.get("lib-wrapper")?.active) {
  //     // Override using libWrapper: https://github.com/ruipin/fvtt-lib-wrapper
  //     libWrapper.register("barbrawl", "CONFIG.Token.objectClass.prototype.drawBars", drawBrawlBars, "OVERRIDE");
  //     libWrapper.register("barbrawl", "CONFIG.Token.documentClass.prototype.getBarAttribute",
  //         function (wrapped, barId, { alternative } = {}) {
  //             const attribute = alternative ?? getBar(this, barId)?.attribute;
  //             if (typeof attribute !== "string") return null;
  //             return wrapped(null, { alternative: attribute });
  //         }, "MIXED");
  // } else {
  // Manual override
  CONFIG.Token.objectClass.prototype.drawBars = drawBrawlBars;

  const originalGetBarAttribute = CONFIG.Token.documentClass.prototype.getBarAttribute;
  CONFIG.Token.documentClass.prototype.getBarAttribute = function (barId, { alternative } = {}) {
    const attribute = alternative ?? getBar(this, barId)?.attribute;
    if (typeof attribute !== "string") return null;
    return originalGetBarAttribute.call(this, null, { alternative: attribute });
  };
}

if (game.modules.get("levels-3d-preview")?.active) {
  // Import required THREE.js classes.
  import("../../levels-3d-preview/scripts/lib/three.module.js").then(three => {
    THREE = {
      SpriteMaterial: three.SpriteMaterial,
      TextureLoader: three.TextureLoader,
      Sprite: three.Sprite
    }
  });

  // Disable Levels3D's internal bar rendering.
  Hooks.once("3DCanvasInit", levels3d => levels3d.CONFIG.entityClass.Token3D.prototype.drawBars = async function () {
    await draw3dBars(this.token);
  });
}
}
