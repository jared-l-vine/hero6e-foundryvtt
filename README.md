# Hero System 6e (Unofficial) v2 - aea

Forked from Hero System 6e (Unofficial)

This system is for playing the sixth edition of the Hero System using FoundryVTT.

HERO SystemTM � is DOJ, Inc.�s trademark for its roleplaying system.
HERO System Copyright � 1984, 1989, 2002, 2009 by DOJ, Inc. d/b/a Hero Games. All rights
reserved.
Fantasy Hero � 2003, 2010 by DOJ, Inc. d/b/a Hero Games. All rights reserved.
Star Hero � 2003, 2011 by DOJ, Inc. d/b/a Hero Games. All rights reserved.
All DOJ trademarks and copyrights used with permission.
For further information about Hero Games and the HERO System, visit www.herogames.com.

## Functionality

This system is a work in progress. The following features are supported

* A proper Turn/Phase/Segment initiative tracking system
* A character sheet that you can upload a .HDC file to
* Attack automation
* The ruler tool will show the default range modifier for the distance drawn

### Character Sheet

The character sheet in this system supports automation for characteristic and skill rolls.

.HDC files created in the Hero Designer can be uploaded to it, and currently supports automatically populating information for a character's characteristics and skills.

Attacks and defense can be manually added by users.

The character sheet can also be used to take a Recovery.

#### Maneuvers

Activating a maneuver from a character sheet will apply OCV and DCV modifiers with the exception of variable modifiers or modifers that take speed into account. Only one maneuver can be selected at a time with the exception of 'Set' and 'Brace'.

### Attack Automation

An attack added by a user can be used by clicking on the attack's image from the Character Sheet 'Attacks' tab. This will add a card to the chat for the attack.

The card will show the attack roll and damage roll as well as any additional effects information below.

### Power and Equipment

These type of items consist of a description and can hold skill, maneuver, attack, defense, or movement type items as 'sub-items'. Adding a power or equipment to a character sheet will sort any 'sub-items' into the appropriate character sheet tab.

Powers can be read in from a .HDC file, but this will not add any sub items.

## System Options
- Use Stunned : whether or not attacks can inflict stunned
- Use Endurance : whether or not endurance will be automatically tracked when using automated attack cards
- Use Knockback : automates knockback rolls and calculations from attack cards
- Hit Locations : automates hit location rolls and calculations from attack cards
- Hit Location (Track Damage Done to Individual Body Parts) : health tracking for individual body parts
- Optional Maneuvers : adds optional maneuvers to character sheets on .HDC upload
- Attack Card Automation:
    No Automation: attack card will show attack and damage results, but will not update body, stun, or end from target
    NPCs Only: attack card will subtract effective values from body, stun, and end but only for actors/tokens without a player owner
    PCs(end) and NPCs: same as NPCs only except actors/tokens with a player owner will update end
    PCs and NPCs: attack card will update stun, body, and end for all tokens/actors 