import {midiToABC, Chord, generateTest} from "./chord";

const DEFAULT_DURATION = 4;
const DEFAULT_KEY = "Bb";
const STAFF_MARKER = "%%staves {1,2}";

const music = {
    title: "",
    meter: "C",
    noteLength: DEFAULT_DURATION,
    key: DEFAULT_KEY,
    measuresPerLine: 3,
    staffTop: generateTest(),
    staffBot: generateTest(false)
}

// this function is identical to the one above, but it does not insert line breaks.
const generateABC = function () {
    let result = `T:${music.title}\n`;
    result += `M:${music.meter}\n`;
    result += `L:1/${music.noteLength}\n`;
    result += `K:${music.key}\n`;
    result += STAFF_MARKER + "\n";
    const headerTop = `V:1\n[K:${music.key} clef=treble]\n`;
    const headerBot = `V:2\n[K:${music.key} clef=bass]\n`;
    const notesTop = music.staffTop;
    const notesBot = music.staffBot;

    // generate top line
    let lineTop = "";
    for (let i = 0, time = 0; i < notesTop.length; i++) {
        lineTop += notesTop[i].getABCString(DEFAULT_KEY); // recall that elements of notesTop are chord objects
        time += notesTop[i].duration;
        if (time >= DEFAULT_DURATION) {
            lineTop += "|";
            time = 0;
        }
    }
    if (lineTop[lineTop.length - 1] !== "|") lineTop += "|"; // ensure measure at end

    // same logic for bottom line
    let lineBot = "";
    for (let i = 0, time = 0; i < notesBot.length; i++) {
        lineBot += notesBot[i].getABCString(DEFAULT_KEY);
        time += notesBot[i].duration;
        if (time >= DEFAULT_DURATION) {
            lineBot += "|";
            time = 0;
        }
    }
    if (lineBot[lineBot.length - 1] !== "|") lineBot += "|"; // ensure measure at end

    // add final bar lines
    lineTop += "]";
    lineBot += "]";

    // add lines
    result += headerTop;
    result += lineTop + "\n";
    result += headerBot;
    result += lineBot + "\n";
    
    console.log(result);
    return result;
}

const generateMidiTimingArr = function() {

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
        if (abc[i] === ",") pReg -= 12;
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

export { testABC, pianoEX, music, midiToABC, abcToMidi, generateABC }

// -------------------- TESTS --------------------

function test_abcToMidi(note, expected) {
    let midi = abcToMidi(note);
    if (midi != expected) {
        console.log(`Error, got ${note} and expected ${expected} but returned ${midi}`)
    } else {
        console.log(`test passed`)
    }
}

test_abcToMidi('C', 60);
test_abcToMidi('D', 62);
test_abcToMidi('_C', 59);
test_abcToMidi('^C', 61);
test_abcToMidi("^C'", 73);
test_abcToMidi("^C,", 49);
test_abcToMidi("_D,", 49);

function test_midiToABC(midi, expected, useflats=false) {
    let note = midiToABC(midi, useflats);
    if (note != expected) {
        console.log(`Error, got ${midi} and expected ${expected} but returned ${note}`)
    } else {
        console.log(`test passed`)
    }
}

test_midiToABC(60, 'C');
test_midiToABC(62, 'D');
test_midiToABC(58, '_B');
test_midiToABC(61, '^C');
test_midiToABC(73, "^C'");
test_midiToABC(49, "^C,");
test_midiToABC(49, "_D,", true);


const get_key_sig_normalizer = (sig) => (note) => {
    if (note in sig) {
        return note.slice(1)
    } else {
        note
    }
}
