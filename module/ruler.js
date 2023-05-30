import { HEROSYS } from "./herosystem6e.js";

export class HeroRuler {
    static initialize() {
        Hooks.once("init", () => {
            Ruler.prototype._getSegmentLabel = function _getSegmentLabel(segmentDistance, totalDistance, isTotal) {
            let rangeMod = Math.ceil(Math.log2(totalDistance / 8)) * 2;

            rangeMod = rangeMod < 0 ? 0 : rangeMod;

            let label = "[" + Math.round(segmentDistance.distance) + " m]" + "\n-" + rangeMod + " Range Modifier"

            return label
            };
        });

        Hooks.once('dragRuler.ready', (SpeedProvider) => {
            class HeroSysSpeedProvider extends SpeedProvider {
            get colors() {
                return [
                {id: "walk", default: 0x00FF00, name: "my-module-id.speeds.walk"},
                {id: "dash", default: 0xFFFF00, name: "my-module-id.speeds.dash"},
                {id: "run", default: 0xFF8000, name: "my-module-id.speeds.run"},
                {id: "bad", default: 0x000000, name: "my-module-id.speeds.bad"}
                ]
            }
        
            getRanges(token) {
                const baseSpeed = this.getMovementSpeed(token)
        
                const ranges = [
                {range: Math.ceil(baseSpeed / 2), color: "walk"},
                {range: Math.floor(baseSpeed / 2) + Math.ceil(baseSpeed / 2), color: "dash"},
                {range: baseSpeed * 2, color: "run"}
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
        
        async function movementRadioSelectRender() {
            const tokenControlButton = $(".scene-control[data-control='token']");
        
            const relevantToken = canvas.tokens.controlled[0];
        
            const movmentItems = relevantToken.actor.items.filter((e) => e.type === "movement");
        
            const renderRadioOptions = () => {
            const activeMovement = relevantToken.actor.flags.activeMovement || movmentItems[0]._id
        
            const radioOptions = movmentItems.map((item, index) => `
                <div class="radio" data-tool="${item._id}">
                <input id="radio-${index}" name="radio" type="radio" ${activeMovement === item._id ? 'checked' : ''}>
                <label for="radio-${index}" class="radio-label">${item.name}</label>
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