export function modifyRollEquation(equation, value) {
    if (value != 0) {
        let sign = " + ";
        if (value < 0) {
            sign = " ";
        }
        equation = equation + sign + value;
    }

    return equation
}

export function getTokenChar(token, char, data) {
    let baseActor = game.actors.get(token.data.actorId);

    try {
        return token.data.actorData.data.characteristics[`${char}`][`${data}`];
    } catch (TypeError) {
        return baseactor.system.characteristics[`${char}`][`${data}`];
    }
}
