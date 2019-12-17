interface String {
    makePretty: () => string;
}

String.prototype.makePretty = function(): string {
    let indentLevel = 0;
    let json = this;
    const insertNewLine = (index) => {
        const newLine = `\n${" ".repeat(indentLevel * 4)}`;
        const s1 = json.slice(0, index + 1)
            + newLine
            + json.slice(index + 1);
        json = s1;
        return newLine.length;
    };
    for (let i = 0; i < json.length; i++) {
        const c = json[i];
        if (c === "{" || c === "[") {
            indentLevel++;
            insertNewLine(i);
        }
        if (c === "}" || c === "]") {
            indentLevel--;
            i += insertNewLine(i - 1);
        }
        if (c === ",") {
            insertNewLine(i);
        }
    }
    return json;
};
