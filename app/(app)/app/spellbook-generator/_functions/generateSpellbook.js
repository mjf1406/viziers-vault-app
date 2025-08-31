/** @format */

import { droll } from "@droll"; // https://www.npmjs.com/package/droll

async function generateSpellbook() {
    document.getElementById("output-table").innerHTML = "";

    let level = getSelectedValueFromRadioGroup("wizard-level");
    let schools = getSelectedItemsFromCheckboxGroup("wizard-school");

    schools = schools.map((item) => item.charAt(0).toUpperCase()); // Conver the school names to their abbreviations

    if (level === "random") level = getRndInteger(1, 20);
    else level = parseInt(level);

    let numberOfSpells = (level - 1) * 2 + 6;
    const sbg_settings = await db.sbg_settings.toArray();
    const extraSpellsProbability = parseFloat(sbg_settings[0].VALUE);
    let [die, target] = probabilityToStandardDie(extraSpellsProbability);
    const maxNumberOfExtraSpells = parseInt(sbg_settings[1].VALUE);
    for (let index = 1; index < level + 1; index++) {
        const extraSpells = droll.roll(die);
        const extra = getRndInteger(1, maxNumberOfExtraSpells);
        if (extraSpells > target) numberOfSpells += extra;
    }

    const dbSpells = await fetchLocalJson("/mikitz-ttrpg/data/json/spells");

    const spellLevel = spellBook.find((e) => e.LEVEL == level).SLOT_LEVEL;
    let tableSpells = dbSpells.filter((e) => e.level <= spellLevel);
    tableSpells = tableSpells.filter((e) => schools.includes(e.school));
    tableSpells = tableSpells.filter((e) => !e.name.includes("UA")); // Remove UA Spells
    tableSpells = tableSpells.filter((e) => !e.source.includes("UA"));

    const tableData = [];
    const dbData = [];

    let lSpells = [];
    for (let index = 0; index < numberOfSpells; index++) {
        let prop = randomProperty(tableSpells);
        let spellName = prop.name;
        while (lSpells.some((spell) => spell.NAME == spellName)) {
            prop = randomProperty(tableSpells);
            spellName = prop.name;
        }
        const sLink = cheesePizza(prop.name, prop.source);
        lSpells.push({ NAME: spellName, LINK: sLink[0] });
        const magicSchool = (schoolFirstLetter) => {
            for (let index = 0; index < schoolsOfMagic.length; index++) {
                const element = schoolsOfMagic[index];
                if (element.charAt(0) == schoolFirstLetter.toLowerCase())
                    return element;
            }
        };
        const school = magicSchool(prop.school);
        tableData.push({
            NAME: sLink[1],
            LEVEL: prop.level,
            SCHOOL: school,
            SOURCE: prop.source,
        });
        dbData.push({
            NAME: prop.name,
            LINK: sLink[0],
            LEVEL: prop.level,
            SCHOOL: school,
            SOURCE: prop.source,
        });
    }
    tableData.sort((a, b) => a.LEVEL - b.LEVEL); // Sort by ascending level

    $("#output-table").jsGrid({
        height: "100%",
        sorting: true,
        paging: false,
        data: tableData,
        // pageSize: 15,
        fields: [
            { name: "NAME", type: "text", width: "20rem" },
            { name: "LEVEL", type: "text", width: "5rem" },
            { name: "SCHOOL", type: "text", width: "10rem" },
            { name: "SOURCE", type: "text", width: "5rem" },
        ],
    });

    const now = new Date();
    const data = {
        DATETIME: now,
        LEVEL: level,
        SCHOOLS: schools,
        SPELL_QUANTITY: numberOfSpells,
        SPELLS: dbData,
        DISPLAY_DATA: tableData,
    };
    localStorage.setItem("recent-spellbook", JSON.stringify(data));

    document.getElementById(
        "caption"
    ).innerText = `A level-${level} Wizard's Spellbook`;

    await db.sbg_spellbooks.put(data);
    await populateSpellbookHistory();
}
