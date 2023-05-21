# Version 2.1.6-alpha
- Added 3rd attribute bar. Expectation is to show body, stun, and endurance for most tokens.  [#75](https://github.com/dmdorman/hero6e-foundryvtt/issues/75)
- Improved the default character sheet.
- Added Perception as a skill [#97](https://github.com/dmdorman/hero6e-foundryvtt/issues/97)
- Skill rolls dynamically change with characteristic changes.
- Improved damage dice and END estimation listed on sheet to account for strength. [#83](https://github.com/dmdorman/hero6e-foundryvtt/issues/83)
- Fixed mislabled rED and added MD defense summary to left panel of character sheet [#86](https://github.com/dmdorman/hero6e-foundryvtt/issues/86)
- Removed flight from characteristics [#87](https://github.com/dmdorman/hero6e-foundryvtt/issues/87)
- STR shows lift and throw notes [#51](https://github.com/dmdorman/hero6e-foundryvtt/issues/51)
- Attack edit sheet relaced "Value" with "Damage Dice" [#94](https://github.com/dmdorman/hero6e-foundryvtt/issues/94)

# Version 2.1.5-alpha
- 5th edition characters get figured characteristics and 5E stun multiplier on killing attacks.
- A second (improved) character sheet is available to preview.
- DragDrop to hotbar for attacks, skills and power toggles (like defenses)

# Version 2.1.4-alpha
- NOKB, DOUBLEKB, and KBRESISTANCE
- Penetrating, Armor Piercing, Hardened
- Body and Stun only

# Version2.1.3-alpha
- Adding distinction between PC and NPC actors
- Automation updates (end, body, stun)
- Adding area of effect attribute for attacks

# Version 2.1.2-alpha
- Attack card automation rework

# Version 2.1.1-alpha
- Maneuver fix [#39](https://github.com/dmdorman/hero6e-foundryvtt/issues/39)

# Version 2.1.0-alpha
- power item rework
- Known Issues:
    - Maneuvers items are applying OCV/DCV modifications
    - Defense items toggles are not working
    - Can't edit/delete Power sub items directly from actor sheet
    - Updating and item on an unlinked actor sheet updates the base actor and not the actor in the scene

# Version 2.0.4-alpha
- fixed an issue with the combat tracker not working
- fixed an issue with the Upload .HDC button that caused it to fail
- Upload .HDC now reads in perks, talents, complications, and martial arts
- additional V10 migration

# Version 2.0-alpha
- V10 migration
- changed characteristic keys so that other characteristics can work with Barbrawl
- Known Issues:
    - can't edit power/equipment 'sub-items' from character sheet (to add powers to a character sheet use the item tab
        to create and edit the power there then drag the item onto a character sheet)

# Version 1.1.2
- Bugfixes
    - movement powers were showing the wrong type
    - couldn't update sub item descriptions
    - recovery button didn't produce chat message
    - attack card automation wouldn't work with power sub items
    - attack card automation wouldn't work with attacks that used strength or knockback
    - imitative tracking wasn't working
- Added a dice button for attack roll actions
- Now prioritizing player characters in initiative tracking
- Known Issues
    - clicking 'Apply to Target' with an attack card generated from a power sub item displays a message
        'Error: Item does not exist', this should be safe to ignore
    - can't edit power/equipment 'sub-items' from character sheet (to add powers to a character sheet use the item tab
        to create and edit the power there then drag the item onto a character sheet)
    - rolling initiative produces an error message, this can likely be ignored

# Version 1.1.1
- Bugfixes
    - Split up attack card because players could only make attacks against themselves
    - Attack card messages had wrong sender name

# Version 1.1.0
- Added Characteristics base values to character sheet, Editable only in 'Edit' mode on character sheet
- Added End cost to power/equipment item sheets
- Added a field on attack items for custom additional effects, custom effect text will display the end of attack cards
- Bugfixes
    - characteristic rolls weren't updating after changing max end/body/stun
    - movement value wasn't updating properly in power/equipment sub items
    - couldn't update sub items from character sheet
    - couldn't update actor name
    - reading in vehicles added additional blank characteristic to character sheet
    - automated attacks fail without Hit Locations setting
    - upload .HDC fails when name is not present in .HDC file

# Version 1.0.0
- forked from https://github.com/jared-l-vine/hero6e-foundryvtt
- updated to work with Foundry 9.280
- added option to automatically track endurance
- added hit locations option
- added knockback option
- added powers and equipment items
- added maneuver item
