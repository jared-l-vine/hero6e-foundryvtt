export default class SettingsHelpers {
    // Initialize System Settings after the Init Hook
    static initLevelSettings() {
      let module = "hero6e-foundryvtt-experimental";

      game.settings.register(module, "use endurance", {
        name: "Use Endurance",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        onChange: value=> console.log(value)
      });

      game.settings.register(module, "hit locations", {
        name: "Hit Locations",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: value=> console.log(value)
      });
    }
  }