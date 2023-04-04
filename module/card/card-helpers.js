import { HeroSystem6eCard } from "./card.js";
import { HeroSystem6eAttackCard } from "./attack-card.js";
import { HeroSystem6eToHitCard } from "./toHit-card.js"
import { HeroSystem6eToHitCard2 } from "./toHit-card2.js"
import { HeroSystem6eDamageCard } from "./damage-card.js";

export class HeroSystem6eCardHelpers {
    static onMessageRendered(html) {
        HeroSystem6eAttackCard.onMessageRendered(html);
        HeroSystem6eToHitCard.onMessageRendered(html);
        HeroSystem6eDamageCard.onMessageRendered(html);
    }

    static chatListeners(html) {
        HeroSystem6eCard.chatListeners(html);
        HeroSystem6eAttackCard.chatListeners(html);
        HeroSystem6eToHitCard.chatListeners(html);
        HeroSystem6eToHitCard2.chatListeners(html);
        HeroSystem6eDamageCard.chatListeners(html);
    }
}