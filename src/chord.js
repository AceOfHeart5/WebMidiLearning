import { KEY_SIGNATURES, LETTERS } from "./keysigs"

// add all key signatures to key signature drop down
let options = ""
KEY_SIGNATURES.forEach((val, key) => {
    options += `<option value="${key}">${key}</option>`;
})
const KEY_MENU = document.querySelector(".keys");
KEY_MENU.innerHTML = options;

class Pitch {
    constructor(key, staffIndex) {
        this.key = key;
        this.staffIndex = staffIndex;

        /* To determine the register of this note, we determine how far away
        it is from register 4. We do this by subtracting (or adding in the case of
        a negative index) the value of a register (7) until the index is between
        0 and 7. */
        this.register = 0;
        if (staffIndex >= 0) {
            while (staffIndex > 6) {
                staffIndex -= 7;
                this.register++;
            }
        } else {
            while (staffIndex < 0) {
                staffIndex += 7;
                this.register--;
            }
        }
        this.register += 4;

        /* Register is now correct, and the index has been modified to be the equivalent pitch
        class, but in register 4. We can now determine the scale degree of the note using the
        given key and the index. Recall that each key has a "staff_root" element, which is the
        staff index of the root of the key. We can count "down" from the index, wrapping around
        -1 to 6, and incrementing our scale degree by one each decrement. Once our index is
        equal to our staff_root, we will have found the scale degree of the index */
        this.scaleDegree = 1;
        while (staffIndex !== KEY_SIGNATURES.get(key).get("staff_root")) {
            staffIndex--;
            if (staffIndex < 0) staffIndex = 6;
            this.scaleDegree++;
        }

        /* The midi value stored in the key signatures map is only the correct
        pitch class. We now need to get the correct midi value using our newly
        calculated register and scale degree. */
        this.midi = KEY_SIGNATURES.get(key).get(this.scaleDegree)[1];
        for (let i = 0; i <= this.register; i++) this.midi += 12;

        /* Similar to the midi value, we have to create the correct ABCjs string
        using the given register. */
        this.string = KEY_SIGNATURES.get(key).get(this.scaleDegree)[0];
        if (this.register < 4) for (let i = 4; i > this.register; i--) this.string += ",";
        else for (let i = 4; i < this.register; i++) this.string += "'";
    }
}

class Chord { 
    constructor(duration) {
        this.pitches = []; // pitches are pitch objects
        /* We should elaborate on duration here. Duration is actually a multiplier
        of DEFAULT_DURATION in the abcjs file. Recall that DEFAULT_DURATION is 
        actually the denominator of our default note length in abcjs. So if our
        DEFAULT_DURATION is 48, a quarter note should have a duration of 12, and
        eighth note a duration of 6, and a whole note a duration of 48. */
        this.duration = duration; // the ABC modifier for the default length
        this.path = null; // reference to the html element of the note
        this.timingIndex = null; // index this note exists in the timing array
        this.staffIndexLowest = null; // for determining pitch limits in multi pitch chords
        this.staffIndexHighest = null; // same as above
    }

    addPitch(pitch) {
        if (this.pitches.length === 0) {
            this.pitches.push(pitch);
            this.staffIndexLowest = pitch.staffIndex;
            this.staffIndexHighest = pitch.staffIndex;
            return;
        }

        /* In a chord with multiple pitches, pitches must be sorted from lowest
        staff index to highest staff index. */
        this.pitches.push(null);
        for (let i = 0, pitchToMove = pitch; i < this.pitches.length; i++) {
            if (this.pitches[i] === null || pitchToMove.staffIndex < this.pitches[i].staffIndex) {
                let temp = this.pitches[i];
                this.pitches[i] = pitchToMove;
                pitchToMove = temp;
            }
        }
        this.staffIndexLowest = this.pitches[0].staffIndex;
        this.staffIndexHighest = this.pitches[this.pitches.length - 1].staffIndex;
    }

    getABCString() {
        if (this.pitches.length === 0) return "x" + this.duration.toString(); // maybe we could use length 0 to represent rests??
        if (this.pitches.length === 1) return this.pitches[0].string + this.duration.toString();
        let result = "[";
        this.pitches.forEach(e => result += e.string);
        result += "]" + this.duration.toString();
        return result;
    }

    getIndicies() {
        let inds = "[";
        for (let i = 0; i < this.pitches.length; i++) {
            if (i === this.pitches.length - 1) inds += this.pitches[i].staffIndex;
            else inds += this.pitches[i].staffIndex + ", ";
        }
        inds += "]";
        return inds;
    }
}

// returns a string of the pitch class and register equivalent of the given staff index
const getPitchStringFromIndex = function(index) {
    let register = 4;
    if (index >= 0) {
        while (index >= 7) {
            index -= 7;
            register++;
        }
    } else {
        while (index < 0) {
            index += 7;
            register--;
        }
    }
    let string = LETTERS[index] + register.toString();
    if (string === "C4") string += " *";
    return string;
}

/* returns an array of chord objects, each with the given duration, number of pitches, and 
pitches between the min and max (inclusive) */
const generateNotes = function (key = "C", indMin = 0, indMax =  15, numOfPitches = 1, duration = 12) {

    /* I straight up forgot how this line works! I know that it only works for 4/4 timing, and the
    5 is for 5 lines of music. Must revist and make work with other time signatures. */
    const noteNum = 5 * 16 / (duration / 12);

    const arr = []; // the array of chords

    for (let i = 0; i < noteNum; i++) {
        let chord = new Chord(duration);

        // we declare our pitch options by making an array of all valid staff indices
        let options = new Array(indMax - indMin + 1);
        for (let p = 0; p < options.length; p++) options[p] = (indMin + p);

        for (let j = 0; j < numOfPitches; j++) {
            /* We randomly choose an index from the options array, create a pitch from it,
            add it to the chord, and remove that pitch from our options. */
            let choiceIndex = Math.floor(Math.random() * options.length)
            let choice = options[choiceIndex]
            chord.addPitch(new Pitch(key, choice));
            options.splice(choiceIndex, 1);

            /* In order to prevent the music from being unplayable, we have to remove 
            pitch options that are too far away from pitches already in our chord. We've
            chosen an octave to be the maximum span of a chord. First, we'll remove all
            options that are more an than octave higher than the lowest note. */
            let remove = chord.staffIndexLowest + 7;
            let index = 0;
            while (index < options.length && options[index] <= remove) index++;
            /* The index is now at the first position where the option is an invalid
            for the remainder of the array. Since splice deletes n elements, we have 
            to use the number of elements remaining in the array. */
            options.splice(index, options.length - index);

            // now we remove the low notes with the same logic
            remove = chord.staffIndexHighest - 7;
            index = options.length - 1;
            while (index >= 0 && options[index] >= remove) index--;
            /* Moving backwards, the index is now at the position of the first element
            that is less than remove. Since the splice function takes a length, and not
            an end index, we need to add 1 to the index for it to work. For example, 
            let's say we need to remove the first 3 values. This means the index would 
            stopped at 2, so it must be increased to 3 for the splice to work. */
            options.splice(0, index + 1);
        }

        arr.push(chord);
    }
    return arr;
}

export { Chord, generateNotes, getPitchStringFromIndex }
