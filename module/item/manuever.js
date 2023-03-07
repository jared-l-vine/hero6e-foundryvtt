export async function enforceManeuverLimits(actor, itemId, itemName) {
    let exceptions = ["Set", "Brace"]

    for (let i of actor.items) {
        if (i.type === "maneuver" && i.id !== itemId && i.system.active && !exceptions.includes(i.name) || itemName.includes("Move")) {
            await i.update({ ["data.active"]: false });
        }

        // check manuever sub items for powers
        if ((i.type === "power" || i.type === "equipment") && ("maneuver" in i.system.items)) {
            for (const [key, value] of Object.entries(i.system.items.maneuver)) {
                if (value.type && value.visible && value.active && key !== itemId) {
                    await i.update({ [`data.items.maneuver.${key}.active`]: false });
                }
            }
        }
    }
}