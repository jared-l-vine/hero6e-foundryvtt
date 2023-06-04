import { HEROSYS } from "./herosystem6e.js";

export class HeroRuler {
    static initialize() {
        Hooks.once("init", () => {
            setHeroRulerLabel()
        });

        Hooks.once("ready", function() {
            if (!game.modules.get("drag-ruler")) {
                ui.notifications.error(game.i18n.localize("Warning.DragRuler.Intall"));
            }

            if (!game.modules.get("drag-ruler")?.active) {
                ui.notifications.error(game.i18n.localize("Warning.DragRuler.Active"));
            }
        });

        Hooks.once('dragRuler.ready', (SpeedProvider) => {
            class HeroSysSpeedProvider extends SpeedProvider {
            get colors() {
                return [
                    {id: "half", default: 0x00FF00, name: game.i18n.localize("Movement.Half")},
                    {id: "full", default: 0xFFFF00, name: game.i18n.localize("Movement.Full")},
                    {id: "noncombat", default: 0xFF8000, name: game.i18n.localize("Movement.Noncombat")},
                ]
            }
        
            getRanges(token) {
                const baseSpeed = this.getMovementSpeed(token)
        
                const ranges = [
                    {range: Math.ceil(baseSpeed / 2), color: "half"},
                    {range: Math.floor(baseSpeed / 2) + Math.ceil(baseSpeed / 2), color: "full"},
                    {range: baseSpeed * 2, color: "noncombat"}
                ]
        
                return ranges
            }
            
            getMovementSpeed(token) {
                const relevantMovementItemId = token.actor.flags.activeMovement
        
                const movementValue = parseInt(token.actor.items.get(relevantMovementItemId)?.system.value)
                || parseInt(token.actor.system.characteristics.running.value)
        
                return movementValue
            }
            }
        
            dragRuler.registerSystem(HEROSYS.module, HeroSysSpeedProvider)

            setHeroRulerLabel()
        });

        Hooks.on('controlToken', function(token, controlled) {
            if (!game.modules.get('drag-ruler')?.active) { return; }

            const sceneControls = ui.controls
            if (sceneControls.activeControl !== "token") { return; }
            if (sceneControls.activeTool !== "select") { return; }
        
            const tokensControlled = canvas.tokens.controlled.length;
        
            if (tokensControlled !== 1 ) { return;}
        
            movementRadioSelectRender()
        });
        
        Hooks.on('renderSceneControls', function(sceneControls, html) {
            if (!game.modules.get('drag-ruler')?.active) { return; }

            if (sceneControls.activeControl !== "token") { return; }
            if (sceneControls.activeTool !== "select") { return; }
        
            const tokensControlled = canvas.tokens.controlled.length;
        
            if (tokensControlled !== 1) { return; }
        
            movementRadioSelectRender()
        
            return
        });

        Hooks.on('updateItem', function(item, args) {
            if (item.type !== 'movement') { return; }

            const sceneControls = ui.controls
            if (sceneControls.activeControl !== "token") { return; }
            if (sceneControls.activeTool !== "select") { return; }

            movementRadioSelectRender()
        });
        
        async function movementRadioSelectRender() {
            const tokenControlButton = $(".scene-control[data-control='token']");
        
            const relevantToken = canvas.tokens.controlled[0];
        
            const movmentItems = relevantToken.actor.items.filter((e) => e.type === "movement");
        
            const renderRadioOptions = () => {
                const activeMovement = (movmentItems.length === 0)? "none" : relevantToken.actor.flags.activeMovement || movmentItems[0]._id
            
                const radioOptions = movmentItems.map((item, index) => `
                    <div class="radio" data-tool="${item._id}">
                        <input id="radio-${index}" name="radio" type="radio" ${activeMovement === item._id ? 'checked' : ''}>
                        <label for="radio-${index}" class="radio-label" style="text-shadow: 0 0 8px white;">${item.name} (${item.system.value}m)</label>
                    </div>
                `).join('');
            
                const radioSelect = $(`<div class="radio-container">${radioOptions}</div>`);
            
                radioSelect.find('[data-tool]').click(async function() {
                    const tool = $(this).attr('data-tool');
            
                    await relevantToken.actor.update({'flags.activeMovement': tool })
            
                    renderRadioOptions();
                });
            
                if (tokenControlButton.find('.radio-container').length > 0) {
                    tokenControlButton.find('.radio-container').remove();
                }
            
                tokenControlButton.append(radioSelect);
            };
        
            renderRadioOptions();
        }
    }
}

function setHeroRulerLabel() {
    Ruler.prototype._getSegmentLabel = function _getSegmentLabel(segmentDistance, totalDistance, isTotal) {
        let rangeMod = Math.ceil(Math.log2(totalDistance / 8)) * 2;

        rangeMod = rangeMod < 0 ? 0 : rangeMod;

        let label = "[" + Math.round(segmentDistance.distance) + " m]"

        if (game.modules.get("drag-ruler")?.active) {
            const relevantToken = canvas.tokens.controlled[0];
        
            const movmentItems = relevantToken.actor.items.filter((e) => e.type === "movement");
        
            const activeMovement = (movmentItems.length === 0)? "none" : relevantToken.actor.flags.activeMovement || movmentItems[0]._id
    
            const activeMovementLabel = (activeMovement === "none")? "Running" : movmentItems.find((e) => e._id === activeMovement).name

            label += "\n" + activeMovementLabel
        }

        label += "\n-" + rangeMod + " Range Modifier"

        return label
    };
}