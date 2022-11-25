import { HeroSystem6eItem } from "../item/item.js";

async function editSubItem(event, item) {
    event.preventDefault();

    let id = event.currentTarget.id.split(" ")[0];
    let type = event.currentTarget.type;

    let data = item.data.data.items[`${type}`][`${id}`];
    data["linkId"] = item.id;
    data["subLinkId"] = id;

    const itemData = {
        name: data.name,
        type: data.type,
        data: data
    };

    let tempItem = new HeroSystem6eItem(itemData);
    return await tempItem.sheet.render(true);
}

async function deleteSubItem(event, item) {
    event.preventDefault();

    let id = event.currentTarget.id;
    let type = event.currentTarget.type;

    let changes = {};
    changes[`data.items.${type}.${id}.visible`] = false;

    return await item.update(changes);   
}

export { editSubItem, deleteSubItem };