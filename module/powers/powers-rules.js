export const POWERS = {};

POWERS.HANDTOHANDATTACK = "A character with Hand-To-Hand Attack (HA) \
does increased damage in HTH combat. Some \
examples of HA include clubs, especially powerful \
(or mystically enhanced) punches, or energized \
gauntlets which improve a character’s punch.\
Each die of HA adds directly to a character’s \
dice of Normal Damage from their STR (see BR 18). \
To buy an HA, a character spends 5 Active Points \
per 1d6, and applies any Advantages to derive an \
Active Point total. They then applies a mandatory -¼ \
Limitation, Hand-To-Hand Attack (plus any other \
Limitations taken for the Power) to derive a Real \
Cost. This Limitation signifies that the HA damage \
only works if it adds to a character’s damage dice \
based on STR. It cannot function on its own, does \
not add to any other attacks, and does not add to a \
character’s STR in any other way.";

POWERS.SWIMMING = "A character with Swimming can swim on or through water and other liquids. \
Each +2m of Swimming purchased adds to the character’s normal 4m of Swimming";

POWERS.LEAPING = "A character with Leaping can leap great distances. \
Examples of Leaping include characters with super-strong leg muscles, a martial \
artist’s phenomenal leaping ability, or spring-boots.Purchased meters of Leaping \
add to a character’s standard 4m of Leaping. In combat, leaps are identical to Flight, \
except the character must indicate the target point for their leap when they begins their leap, \
and they cannot change direction in mid-leap.";

POWERS.FLIGHT = "A character with Flight can fly through the air. \
Some examples of Flight include wings, jetpacks, boot rockets, and planes. \
With Flight, the character can move, hover in place, gain altitude, and so forth.";

POWERS.TELEPATHY = "A character with Telepathy can read or send \
thoughts. Some examples of Telepathy include classic mind-reading abilities and some truth drugs.\
To use Telepathy, the character makes an MCV \
Attack Roll. If successful, they declares the desired \
Telepathy level, makes a standard Effect Roll (BR \
39), subtracts the target’s Mental Defense (if any), \
and compares the result to the Telepathy Effects \
Table. If the Effect Roll isn’t sufficient to reach the \
desired level, the attack has no effect, but it does \
alert the target. If the Effect Roll is sufficient to \
achieve the desired effect, mental contact has been \
established with the target, who may make a standard Breakout Roll (BR 39). If the Breakout Roll is \
made, the Telepathy fails, but the target is aware of \
the attempt to read their mind. If the Breakout Roll \
is not made, each Phase thereafter the telepath can \
search for one fact, or get the answer to one question; the target will be aware of the fact that their \
mind is being read with Telepathy.\
Telepathy cannot be used to alter or remove \
another character’s memories or Psychological \
Complications. Doing that requires Mind Control \
(for short-term effects) or Transform (for longterm or permanent effect";

POWERS.LUCK = "This Power represents a quality of fate which \
helps events turn out in a character’s favor. The GM \
indicates when a character with Luck should make \
a Luck Roll. Each “6” rolled on the Luck dice counts \
as 1 point of Luck. The GM then decides what (if \
any) lucky event happens to a character. The more \
points of Luck the character rolled, the luckier they \
should be. One point of Luck means something \
minor but helpful (like finding a previously-overlooked clue); three or more points of Luck could \
lead to incredible coincidences and nigh-miraculous defiance of probability";

POWERS.KILLINGATTACK = "A character with Killing Attack (“KA”) can \
make an attack that causes Killing Damage (see BR \
101).\
Each 1d6 of Killing Attack costs 15 \
Character Points (adding a single point of Killing \
Damage to a KA costs 5 points; adding a half die \
costs 10 points). When a character purchases a \
die of Killing Attack, they must define it as working \
in HTH Combat (an “HKA”) or Ranged Combat \
(an “RKA”). Some examples of HKA include \
claws, fangs, bladed weapons such as knives, and \
laser swords. Some examples of RKA include bullets, arrows, lasers, flamethrowers, and throwing \
knives. A character must define their KA as Physical \
or energy damage (i.e., whether it works against \
Resistant PD or Resistant ED) when they buys it, and \
cannot change this thereafter. Killing Attack costs \
END to use";
POWERS.RKA = POWERS.KILLINGATTACK;
POWERS.HKA = POWERS.KILLINGATTACK;

POWERS.DAMAGEREDUCTION = "";

POWERS.BLAST = "A character with Blast can attack at Range, \
doing Normal Damage. Examples of Blasts (EBs) \
include a superhero’s force blast, many types of \
blunt throwing weapons, a wizard’s bolt of mystic \
energy, rubber bullets, or a Galactic Trooper’s \
blaster rifle.\
To use Blast, a character states their target and \
makes an Attack Roll. If they succeeds, they rolls their \
dice to determine the Normal Damage done (see \
BR 101).\
An Blast can apply against Physical Defense \
instead of Energy Defense (for example, force \
beams or thrown chunks of rock), but the character \
must specify this when they buys the Power";
POWERS.ENERGYBLAST = POWERS.BLAST;

POWERS.HEALING = "A character with Healing can heal the injuries \
suffered by himself or another character. Examples \
of Healing include a wizard’s spell which heals \
damage from sword-blows or a werewolf ’s ability to \
regenerate damage.\
To use Healing, roll the dice and count the \
STUN and BODY rolled. The character to whom \
Healing was applied regains that much BODY and \
STUN. However, Healing can only restore BODY \
and STUN lost to an injury; it can’t give a character \
“extra” STUN or BODY beyond that, no matter \
how high the roll is.\
Healing can only be applied to a given injury \
or wound once per day. If a second character tries \
to apply Healing to the same wound, they must \
exceed the amount rolled by the first application to \
have any effect, and the second application of Healing only affects the subject to the extent it exceeds \
the first use";

POWERS.RESISTANTPROTECTION = "Resistant Protection provides a character with \
points of Resistant Defense. Examples of Resistant \
Protection include suits of armor, a superhero’s personal force-field, a cop’s bulletproof vest, or a spell \
of protection against fire. Each 2 points of Resistant \
Defense (either PD, ED, any type of Flash Defense, \
Mental Defense, or Power Defense) costs 3 Character Points. \
Characters often buy Resistant Protection with \
the Limitations Costs Endurance (-½) and Perceivable (usually -0 in this case, since it’s not much of \
a hindrance, but the GM can increase it to -¼ if \
appropriate). This converts Resistant Protection \
into a Constant Power, creating a defensive power \
that has to be maintained with the character’s own \
personal energy. The classic superhero’s force-field \
is a perfect example of this";
POWERS.FORCEFIELD = POWERS.RESISTANTPROTECTION;

POWERS.DRAIN = "A character with Drain can temporarily lower \
the value of one of an opponent’s Characteristics or \
Powers. The character must specify which Power \
or Characteristic they can Drain when they purchases \
Drain.\
To use Drain, a character must make an Attack \
Roll. If successful, they rolls and totals the Drain dice, \
then subtracts the target’s Power Defense (if any). \
The total remaining is the number of Active Points \
lost from the affected Power or Characteristic.\
Drained Character Points return at the rate of \
5 Active Points per Turn (see BR 38)";

POWERS.ENTANGLE= "A character with Entangle can restrain, immobilize, or paralyze another character. Some examples of Entangles include ice bonds, handcuffs, glue \
bombs, paralytic touch, and gravity manipulation.\
To use Entangle, a character must make an \
Attack Roll. If successful, they rolls their Entangle dice \
and counts the Normal Damage BODY. The BODY \
of the Entangle is the BODY rolled; the Entangle \
has 1 PD and 1 ED (Resistant) for each 1d6 of \
Entangle. When a character is Entangled, their arms \
and legs are restrained, giving them a DCV of 0. \
An Entangle completely immobilizes a character, \
making it impossible for them to move\
To escape an Entangle, an Entangled character \
must either do sufficient BODY damage to exceed \
the Entangle’s DEF and destroy its BODY, use a \
Power which allows them to overcome the Entangle’s \
effects (such as Desolidification or Teleportation), \
or find some other appropriate method of escape \
based on the special effect of the Entangle (like \
using Contortionist). No Attack Roll is necessary \
for an Entangled character to hit or do damage to \
the Entangle restraining him. When the Entangle’s \
BODY is reduced to 0, they is free.\
Characters with abilities that cause BODY \
damage and are innate or bought through Inaccessible Foci can use those powers to try to break free. \
Characters with abilities bought through Accessible \
Foci normally cannot use those powers to break \
free from an Entangle.\
If an Entangled character is attacked, the \
Entangle takes damage from the attack first. After \
the attack does damage equal to the Entangle’s \
defense + BODY, the Entangle is destroyed and the \
Entangled character takes the remaining damage (if \
any) normally. Attacks which do not cause BODY \
damage (such as most NNDs or Drains) are not \
affected by an Entangle in this way; the damage \
injures the Entangled character directly.\
Characters other than the Entangled character \
can try to attack and damage the Entangle without \
hurting the person trapped inside it. They must \
make their Attack Roll at a -3 OCV penalty. If they \
succeed, they damage the Entangle but not the \
victim; if they fail, they may attack the Entangle \
normally (see above), or just miss altogether. For \
a +½ Advantage, Takes No Damage From Attacks,\
a character may create an Entangle that’s normally \
“transparent” to damage — attacks against the \
victim don’t hurt the Entangle at all, just the victim. \
The only way to damage the Entangle from outside \
it is to target it specifically at -3 OCV, as described \
above.";

POWERS.EXTRALIMBS = "A character with Extra Limbs has one or more \
usable extra limbs. Some examples of Extra Limbs \
include a prehensile tail, extra arms, or a group of \
tentacles. For 5 Character Points, the character can \
have as many Extra Limbs as they wants, be it 1 or \
100. Extra Limbs provide no OCV bonus, and don’t \
allow a character to make any extra attacks, but \
characters can use them to perform maneuvers not \
possible to bipedal humans (like holding someone \
with both hands and then punching him, or hanging from the ceiling by a tail).";

POWERS.INVISIBILITY = "A character with Invisibility can become invisible to one Sense Group (usually the Sight Sense \
Group). Some examples of Invisilibity include a \
“stealth plane” that’s Invisible to radar or a magic \
ring that lets the wearer fade from sight.\
An Invisible character has a “fringe” around \
himself. Others may perceive the fringe with a \
normal PER Roll at a range of 2m or less. The \
character can pay +10 Character Points to have no \
fringe.\
In combat, Invisibility often makes the character harder to hit, and can make it much easier for \
him to obtain bonuses for Surprise attacks (see BR \
95). However, Invisibility does not automatically \
make a character’s attacks or other Powers Invisible \
as well (that requires the Advantage Invisible Power \
Effects; see BR 65)";