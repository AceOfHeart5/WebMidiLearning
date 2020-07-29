const music = {
    title: "T:",
    meter: "M:C",
    noteLength: "L:1/4",
    key: "K:A",
    staffMarker: "%%staves {1,2}",
    staffTop: "abcdefga",
    staffBot: "G,B,DEF,A,C,A,"
}

const pianoEX = `
T:Piano Music
M:C
L:1/4
K:A
%%staves {1,2}
V:1
AAAA|FACA|ABCD|GFBD
V:2
[K:A clef=bass]
G,,B,,D,,E,,|F,,A,,C,,A,,|A,,B,,C,,D,,|G,,F,,B,,D,,
V:1
[K:A clef=treble]
GBDE|FACA|ABCD|GFBD
V:2
[K:A clef=bass]
G,,B,,D,,E,,|F,,A,,C,,A,,|A,,B,,C,,D,,|G,,F,,B,,D,,
`
const testABC = `
T:Piano Music
M:C
L:1/4
K:A
%%staves {1,2}
V:2
AAAAAAAAAAAAAAAA
V:2
K:B
M:6/8
CCCCCBBB
V:2
FFFFFFFFFFFFFFFF
V:1
BBBBBBBBBBBBBBBB
`

const generateABC = function() {
    let result = music.title + "\n";
    result += music.meter + "\n";
    result += music.noteLength + "\n";
    result += music.key + "\n";
    result += music.staffMarker + "\n";

    /* The staff marker is syntax that declares 2 staves that we can write
    notation to. After experimenting, it looks like writing `V:` lets us
    declare which staff we're writing to. The default cleff of a staff is
    treble, and we can change this with clef=bass inside of []. But it
    also appears we have to set the key again as well. So the full line
    should be [K:A clef=bass]. Since we have to do this for each new line,
    I think it makes the most sense to just redeclare both staves after 
    each line break.

    I think the best way to handle line breaks is to copy the staff strings
    into new strings, and then slowly pick them apart, inserting measures 
    where needed.
    */



    result += "V:1\n";
    result += music.staffTop + "\n";
    result += "V:2\n";
    result += "[K:C clef=bass]\n"
    result += music.staffBot + "\n";

    return result;
}

/* Since we're mostly just worried about piano data, the lowest midi note value 
we'll recieve is 21 for A0, and the highest is 108 for C8*/
const midiToABC = function(midi, useflats=false) {
    let note = "";
    // first we determine the pitch class
    let pClass = midi % 12;
    switch (pClass) {
        case 0:
            note = "C";
            break;
        case 1:
            note = useflats ? "_D" : "^C";
            break;
        case 2:
            note = "D";
            break;
        case 3:
            note = useflats ? "_E" : "^D";
            break;
        case 4:
            note = "E";
            break;
        case 5:
            note = "F";
            break;
        case 6:
            note = useflats ? "_G" : "^F";
            break;
        case 7:
            note = "G";
            break;
        case 8:
            note = useflats ? "_A" : "^G";
            break;
        case 9:
            note = "A";
            break;
        case 10:
            note = useflats ? "_B" : "^A";
            break;
        case 11:
            note = "B";
            break;
    }
    // then we determine the pitch register
    let pReg = midi - pClass;
    switch (pReg) {
        case 12:
            note += ",,,,";
            break;
        case 24:
            note += ",,,";
            break;
        case 36:
            note += ",,";
            break;
        case 48:
            note += ",";
            break;
        case 60:
            // no change needed, middle register!
            break;
        case 72:
            note += "'";
            break;
        case 84:
            note += "''";
            break;
        case 96:
            note += "'''";
            break;
        case 108:
            note += "''''";
            break;
    }
    return note;
}

const abcToMidi = function(abc) {
    // recall that `abc` is a string for ABCjs code

    // determine accidental
    let acc = 0;
    if (abc[0] === '^') acc = 1;
    if (abc[0] === '_') acc = -1;

    // determine "letter" of pitch
    let pitchL = (acc) ? abc[1] : abc[0];

    // use pitchL to determine register
    let pReg = 60; // 60 is the default register
    for (let i = abc.length - 1; abc[i] !== pitchL; i--) {
        if (abc[i] === "'") pReg += 12;
        if (abc[i] === "_") pReg -= 12;
    }

    // determine int value of the pitch class
    let pClass = 0;
    switch (pitchL) {
        case "C":
            pClass = 0;
            break;
        case "D":
            pClass = 2;
            break;
        case "E":
            pClass = 4;
            break;
        case "F":
            pClass = 5;
            break;
        case "G":
            pClass = 7;
            break;
        case "A":
            pClass = 9;
            break;
        case "B":
            pClass = 11;
            break;
    }

    // final midi value is the combined register, class, and accidental modifier
    return pClass + pReg + acc;
}

export { testABC, pianoEX, music, midiToABC, abcToMidi, generateABC }