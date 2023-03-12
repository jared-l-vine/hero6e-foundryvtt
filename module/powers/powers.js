import { HERO } from "../config.js";
import { HEROSYS } from "../herosystem6e.js";
import { HeroSystem6eItem } from "../item/item.js";

async function editSubItem(event, item) {
    event.preventDefault();

    const id = event.currentTarget.id.split(" ")[0];
    const type = event.currentTarget.type;

    const data = item.system.subItems[`${type}`][`${id}`];
    data["linkId"] = item.id;
    data["subLinkId"] = id;

    const itemData = {
        name: data.name,
        type: type,
        data: data
    };

    const tempItem = new HeroSystem6eItem(itemData);
    return await tempItem.sheet.render(true);
}

async function deleteSubItem(event, item) {
    event.preventDefault();

    const id = event.currentTarget.id;
    const type = event.currentTarget.type;

    const keyDeletion = {
        [`system.subItems.${type}.-=${id}`]: null
    }

    return await item.update(keyDeletion);   
}

function getItemCategory(actor, id) {
    const [powerItemId, subItemId] = splitPowerId(id)

    const powerItem = actor.items.get(powerItemId)

    for (const category in powerItem.system.subItems) {
        const categoryItems = powerItem.system.subItems[category]

        for (const categoryItemId in categoryItems) {
            if (categoryItemId === subItemId) {
                return category
            }
        }
    }
}

function isPowerSubItem(actor, id) {
    if (!id.includes('-')) { return false; }

    return true
}

function splitPowerId(id) {
    const [powerItemId, subItemId] = id.split('-')

    return [powerItemId, subItemId]
}

export { editSubItem, deleteSubItem, getItemCategory, isPowerSubItem, splitPowerId };