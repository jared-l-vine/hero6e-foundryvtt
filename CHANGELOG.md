## Version 1.0.0
- forked from https://github.com/jared-l-vine/hero6e-foundryvtt
- updated to work with Foundry 9.280
- added option to automatically track endurance
- added hit locations option
- added knockback option
- added powers and equipment items
- added manuever item

## Version 1.1.0
- Added Characteristics base values to character sheet, Editable only in 'Edit' mode on charater sheet
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

## Version 1.1.1
-Bugfixes
    - Split up attack card because players could only make attacks against themselves
    - Attack card messages had wrong sender name

## Version 1.1.2
-Bugfixes
    - movement powers were showing the wrong type
    - couldn't update sub item descriptiosn
    - recovery button didn't produce chat message
    - attack card automation wouldn't work with power sub items
    - attack card automation wouldn't work with attacks that used strength or knockback
    - initative tracking wasn't working
- Added a dice button for attack roll actions
- Now prioritizing player characters in initiative tracking
- Known Issues
    - clicking 'Apply to Target' with an attack card generated from a power sub item displays a message
        'Error: Item does not exist', this should be safe to ignore
    - can't edit power/equpipment 'sub-items' from character sheet (to add powers to a character sheet use the item tab
        to create and edit the power there then drag the item onto a character sheet)
    - rolling initiative produces an error message, this can likely be ignored

## Version 2.0-alpha
- V10 migration
- changed characteristic keys so that other charactersitics can work with Barbrawl
- Known Issues:
    - can't edit power/equpipment 'sub-items' from character sheet (to add powers to a character sheet use the item tab
        to create and edit the power there then drag the item onto a character sheet)