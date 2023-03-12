import { HERO } from "../config.js";
import { HEROSYS } from "../herosystem6e.js";
import { getItem, HeroSystem6eItem } from "../item/item.js";

async function editSubItem(event, item) {
    event.preventDefault();

    const clickedElement = $(event.currentTarget);
    const id = clickedElement.parents('[data-id]')?.data().id
    const type = clickedElement.parents('[data-type]')?.data().type

    const [powerItemId, subItemId] = splitPowerId(id)

    const itemData = game.items.get(powerItemId).system.subItems[type][subItemId]
    itemData.system.realId = powerItemId + '-' + subItemId
    itemData._id = foundry.utils.randomID(16)
    itemData.type = type

    const tempItem = new HeroSystem6eItem(itemData);

    return await tempItem.sheet.render(true);
}

async function deleteSubItem(event, item) {
    event.preventDefault();

    const clickedElement = $(event.currentTarget);
    const id = clickedElement.parents('[data-id]')?.data().id
    const type = clickedElement.parents('[data-type]')?.data().type

    const [powerItemId, subItemId] = id.split('-')

    const keyDeletion = {
        [`system.subItems.${type}.-=${subItemId}`]: null
    }

    return await item.update(keyDeletion);   
}

function getItemCategory(id, actor = null) {
    const [powerItemId, subItemId] = splitPowerId(id)

    const powerItem = getItem(powerItemId)

    for (const category in powerItem.system.subItems) {
        const categoryItems = powerItem.system.subItems[category]

        for (const categoryItemId in categoryItems) {
            if (categoryItemId === subItemId) {
                return category
            }
        }
    }
}

function isPowerSubItem(id) {
    if (!id.includes('-')) { return false; }

    return true
}

function splitPowerId(id) {
    const [powerItemId, subItemId] = id.split('-')

    return [powerItemId, subItemId]
}

async function subItemUpdate(id, formData) {
    const [powerItemId, subItemId] = id.split('-')

    const type = getItemCategory(id)

    for (const key in formData) {
        const newKey = 'system.subItems.' + type + '.' + subItemId + '.' + key
        formData[newKey] = formData[key]
        delete formData[key]
    }

    const item = getItem(powerItemId)
    item.update(formData)
}

export { editSubItem, deleteSubItem, getItemCategory, isPowerSubItem, splitPowerId, subItemUpdate };