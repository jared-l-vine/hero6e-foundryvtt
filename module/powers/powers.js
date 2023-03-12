import { HERO } from "../config.js";
import { HEROSYS } from "../herosystem6e.js";
import { HeroSystem6eItem } from "../item/item.js";

async function editSubItem(event, item) {
    event.preventDefault();

    const clickedElement = $(event.currentTarget);
    const id = clickedElement.parents('[data-id]')?.data().id
    const type = clickedElement.parents('[data-type]')?.data().type
    // const formData = clickedElement.closest('form[data-id][data-realId]')
    // const id = formData.data().id
    // const realId = formData.data().realId

    const [powerItemId, subItemId] = splitPowerId(id)

    const itemData = game.items.get(powerItemId).system.subItems[type][subItemId]
    itemData.system.realId = powerItemId + '-' + subItemId
    itemData._id = foundry.utils.randomID(16)
    itemData.type = type

    HEROSYS.log(itemData)
    // const data = item.system.subItems[`${type}`][`${id}`];
    // data["linkId"] = item.id;
    // data["subLinkId"] = id;



    // const itemData = {
    //     name: data.name,
    //     type: type,
    //     data: data,
    // };

    const tempItem = new HeroSystem6eItem(itemData);
    HEROSYS.log('item id!')
    HEROSYS.log(tempItem._id)

    // tempItem._id = data["linkId"] + '-'

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

function getItemCategory(id) {
    const [powerItemId, subItemId] = splitPowerId(id)

    const powerItem = game.items.get(powerItemId)

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
    HEROSYS.log(id)
    HEROSYS.log(formData)

    const [powerItemId, subItemId] = id.split('-')

    const type = getItemCategory(id)

    for (const key in formData) {
        const newKey = 'system.subItems.' + type + '.' + subItemId + '.' + key
        formData[newKey] = formData[key]
        delete formData[key]
    }

    game.items.get(powerItemId).update(formData)
}

export { editSubItem, deleteSubItem, getItemCategory, isPowerSubItem, splitPowerId, subItemUpdate };