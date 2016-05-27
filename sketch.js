var tracks = 2;
var width;
var stopwidth;
var slidermargin;
var tempoSlider = [];
var lengthSlider = [];
var seedSlider = [];
var granularitySlider = [];
var delaySlider = [];
var select1 = [];
var select2 = [];
var enabled = [];
var running = [];
var next = 0;
var beat = [];
var soundorder = [ "silence", "kick", "hihat", "snare", "bugara" ];
var soundvolumes = { "silence" : 0.0, "kick" : 0.9, "snare" : 0.3, "hihat" : 0.5 , "bugara" : 0.5};
var sounds = {};

function partial(fn /*, args...*/) {
  // A reference to the Array#slice method.
  var slice = Array.prototype.slice;
  // Convert arguments object to an array, removing the first argument.
  var args = slice.call(arguments, 1);

  return function() {
    // Invoke the originally-specified function, passing in all originally-
    // specified arguments, followed by any just-specified arguments.
    return fn.apply(this, args.concat(slice.call(arguments, 0)));
  };
}

function preload() {
    for (var s in soundvolumes) 
    {
        if ( s != "silence" )
        {
           sounds[s] = loadSound("static/sounds/" + s + ".mp3");
           sounds[s].setVolume(soundvolumes[s]);
        }
        else
        {
            sounds[s] = null;
        }
   }
}

function make_sound(the_string, the_beat, x_sample, pt_sample)
{
    if (the_string[the_beat] === "x")
    {
        if (x_sample)
        {
            x_sample.play();
        }
    }
    else
    {
        if (pt_sample)
        {
            pt_sample.play();
        }
    }
}

function euclidean_helper(length, seed, granularity, stringsofar) {
    var division = Math.floor(length/seed);
    var remainder = length % seed;
    if (remainder >= granularity)
    {
        var div2_rem2_stringsofar = euclidean_helper(seed, remainder, granularity, stringsofar);
        var div2 = div2_rem2_stringsofar[0];
        var rem2 = div2_rem2_stringsofar[1];
        var stringsofar = div2_rem2_stringsofar[2];
        var s = "";
        if (remainder > granularity)
        {
            var d_r_s = euclidean_helper(remainder, granularity, granularity, "");
            s = d_r_s[2];
        }
        else
        {
            s = make_string(remainder);
        }
        return [div2, rem2, stringsofar.repeat(division) + s ];
    }
    else
    {
        var s = "";
        if (seed > granularity) 
        {
            var d_r_s = euclidean_helper(seed, granularity, granularity, "");
            s = d_r_s[2];
        }
        else
        {
            s = make_string(seed);
        }
        return [division, remainder, s.repeat(division) + make_string(remainder)];
    }
}

function euclidean(length, seed, granularity)
{
    var d_r_s = euclidean_helper(length, seed, granularity, "");
    var s = d_r_s[2];
    return s;
}


function enabledEvent(idx) 
{
    beat[idx] = -1; // start at -1 to ensure that beat zero sounds immediately 
    running[idx] = this.checked()
    if (this.checked())
    {
        next = millis(); // prepare for next event and handle current event
        loop();
    }
    else
    {
        // save some energy :)
        var anythingrunning = running.reduce((a, b) => a | b, false);
        if (!anythingrunning)
            noLoop();
    }
}

function make_string(seed) 
{
    if (seed > 1) 
    {
        return "x" + ".".repeat(seed-1);
    } 
    else if (seed == 1) 
    {
        return "x";
    }
    else 
    {
        return "";
    }
}

function windowResized() 
{
  resizeCanvas(windowWidth, windowHeight);
}

function setup() 
{
    //createCanvas(1300, 1000);
    createCanvas(windowWidth, windowHeight);

    smooth(2);
    width = 150;
    stopwidth = 30;
    slidermargin = 50;
    next = 0;    

    for (var t = 0; t < tracks; t++)
    {
        running.push(false);
        beat.push(0);
        enabled.push(createCheckbox('enable', false));
        enabled[t].changed(partial(enabledEvent, t));

        tempoSlider.push(createSlider(40,400,100));
        tempoSlider[t].style('width', width+'px');
        tempoSlider[t].style('background-color', 'white');  // needed for firefox on linux
        lengthSlider.push(createSlider(1, 32, 16));
        lengthSlider[t].style('width', width+'px');
        lengthSlider[t].style('background-color', 'white'); // needed for firefox on linux
        seedSlider.push(createSlider(1,32,4));
        seedSlider[t].style('width', width+'px');
        seedSlider[t].style('background-color', 'white');
        granularitySlider.push(createSlider(1,32,32));
        granularitySlider[t].style('width', width+'px');
        granularitySlider[t].style('background-color', 'white');
        delaySlider.push(createSlider(0,31, 0));
        delaySlider[t].style('width', width+'px');
        delaySlider[t].style('background-color', 'white');
        
        var sel = createSelect();
        for (var i=0; i < soundorder.length; i++)
        {
            sel.option(soundorder[i]);
        }
        select1.push(sel); 

        var sel2 = createSelect();
        for (var j=0; j < soundorder.length; j++)
        {
            sel2.option(soundorder[j]);
        }
        select2.push(sel2);

    }
}


function singleTrack(index, m, x, y) {
    fill(255);

    ellipse(x, y, 2*width - stopwidth, 2*width - stopwidth);
    rectMode(CENTER);
    enabled[index].position(x - 25, y - slidermargin);
    rectMode(LEFT);

    var sldx = x + width + slidermargin;
    var txtx = x + 2*width + slidermargin + 5;

    fill(0);
    
    if (index === 0)
    {
        var tempy = y - 4*slidermargin;
        tempoSlider[index].position(sldx, tempy);
        textAlign(LEFT);
        text("tempo: " + tempoSlider[index].value(), txtx, tempy);
    }

    var s1y = y - 3*slidermargin;
    select1[index].position(sldx, s1y);
    
    var s2y = y - 2*slidermargin;
    select2[index].position(sldx, s2y);

    var ly = y - slidermargin;
    lengthSlider[index].position(sldx, ly);
    text("length: " + lengthSlider[index].value(), txtx, ly);

    var sy = y;
    seedSlider[index].position(sldx, sy);
    text("target pattern length: " + seedSlider[index].value(), txtx, sy);

    var gy= y+ slidermargin;
    granularitySlider[index].position(sldx, gy);
    text("max pattern length: " + granularitySlider[index].value(), txtx, gy);

    var dy = y + 2*slidermargin;
    delaySlider[index].position(sldx, dy);
    var delay = delaySlider[index].value();
    text("delay: " + delay, txtx, dy);

    var undelayed_seq = euclidean(lengthSlider[index].value(),
                        seedSlider[index].value(),
                        granularitySlider[index].value());
    var numStops = lengthSlider[index].value();
    var delay_reduced = delay % numStops;
    var seq = undelayed_seq.slice(-delay_reduced) + undelayed_seq.slice(0, -delay_reduced); // implement delay by rotating string
    text("string: " + seq, sldx, dy + slidermargin);

    fill(255);

    if (running[index]) 
    {
       fill(0);
       textAlign(CENTER);
       text("beat: " + beat[index], x, y);

       if ( m > next )
       {
           beat[index] += 1;
           if (beat[index] >= lengthSlider[index].value())
               beat[index] = 0;
           make_sound(seq, beat[index], sounds[select1[index].value()], 
                                        sounds[select2[index].value()]);
       }      
    }
    
    for (var i = 0; i < numStops; i++)
    {
        var angle = radians(i*360.0/numStops);
        var cx = x + sin(angle)*width;
        var cy = y - cos(angle)*width;  // aargh stupid y axis points down
        if (seq[i] === "x") 
        {
            fill(128);
        }
        else
        {
            fill(255);
        }

        if (i===beat[index])
        {
            push();  // Start a new drawing state
            strokeWeight(10);
            if (seq[i] === "x")
            {
                fill(204, 153, 0);
            }
            else
            {
                fill(204, 153, 255);
            }
            ellipse(cx, cy, stopwidth*2, stopwidth*2);
            pop();
        }
        else
        {
            ellipse(cx, cy, stopwidth, stopwidth);
        }
        
        textAlign(CENTER);
        fill(0);
        text(i, cx, cy);
    }
}

function draw() {
    background(255);

    var m = millis();

    singleTrack(0, m, 200,300);
    singleTrack(1, m, 900,300);

    if ( m > next) 
    {
        next = m + 1000*60/tempoSlider[0].value(); // prepare for next event and handle current event
    }

}

