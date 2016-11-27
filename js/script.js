document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    d3.carte = function() {
        var TRANSITION_DURATION = 75,
            linearScale = d3.scale.linear().domain([0, 1060]).range([0, 340]),
            css_width = 200,
            css_height = 200,
            svg_width = css_width,
            svg_height = css_height,
            dataPath = null,
            colors = {
                sea: '#b8d0c5',
                land: '#333',
                border: '#ddd'
            },
            border = {
                width: 1
            },
            noSelectCSS = {
                '-webkit-touch-callout': 'none',
                '-webkit-user-select': 'none',
                   '-moz-user-select': 'none',
                    '-ms-user-select': 'none',
                        'user-select': 'none'
            },
            tooltip = d3.select('body')
                .append('div')
                .attr('class', 'tooltip')
                .style('display', 'none')
                .style('position', 'absolute')
                .style('padding', '8px')
                .style('background-color', '#222')
                .style('border-radius', '3px')
                .style('box-shadow', '4px 4px 10px rgba(0, 0, 0, 0.4)')
                .style('pointer-events', 'none')
                .style(noSelectCSS);
            tooltip.append('p')
                .style('margin', 0)
                .style('font-size', '16px')
                .style('line-height', '20px')
                .style('color', 'white')
              .append('span')
                .attr('class', 'value');

        // Returns a function that projects 3D spherical coordinates to a 2D cartesian plane
        function createProjection() {
            var scale = linearScale(svg_height);
            return d3.geo.robinson()
                .scale(scale)
                .translate([svg_width / 2, svg_height / 2]);
        }

        // Returns a function that takes a two-element array of numbers (projected 2D geometry)
        // formats it appropriately for SVG (or Canvas).
        // [longitude, latitude] => [x, y]
        function createPath(projection) {
            return d3.geo.path().projection(projection);
        }

        // Calls a callback function when all transitions of a selection have ended. To be passed as an argument to the "transition.call(function[, arguments...])" method of D3.js.
        function endAll(transition, callback) {
            if (transition.size() === 0) { callback(); }
            var n = 0;
            transition.each(function() { ++n; })
                .each('end', function() { if (!--n) callback.apply(this, arguments); });
        }

        function my(selection) {
            d3.json(dataPath, function(error, data) {
                if (error) { return console.error(error); }

                // Convert from TopoJSON to GeoJSON
                var subunits = topojson.feature(data, data.objects.subunits);

                var projection = createProjection();
                var path = createPath(projection);
                var bounds = path.bounds(subunits);

                var zoom = d3.behavior.zoom()
                    .scaleExtent([1, 8])
                    .on('zoom', function(d) {
                        var t = d3.event.translate;
                        var s = d3.event.scale;
                        var w = (bounds[1][0] - bounds[0][0] - svg_width)/2 * s;
                        if (w < 0) w = 0;
                        var h = 0;

                        // Remove this temporarily until I fix a bug.

                        //// Horizontal
                        //t[0] = Math.min(
                            //(svg_width/svg_height) * (s - 1) + w,
                            //Math.max(svg_width * (1 - s) - w, t[0])
                        //);

                        //// Vertical
                        //t[1] = Math.min(
                            //h * (s - 1) + h * s,
                            //Math.max(svg_height * (1 - s) - h * s, t[1])
                        //);

                        //// This is needed so that zooming always follows the position of the cursor.
                        //zoom.translate(t);

                        svg.attr('transform', 'translate(' + t + ') scale(' + s + ')');

                        // Redraw borders.
                        svg.select('.subunit-boundary')
                            .attr('stroke-width', border.width / s);
                    });

                var svg = d3.select(selection)
                    .append('svg')
                    .attr('class', 'carte')
                    .attr('width', svg_width)
                    .attr('height', svg_height)
                    .style('display', 'block')
                    .style('font-family', 'sans-serif')
                    .style('font-size', '11px')
                    .style('background-color', colors.sea)
                    .style(noSelectCSS)
                    .on('mousedown', function() { d3.select(selection).style('cursor', 'move'); })
                    .on('mouseup', function() { d3.select(selection).style('cursor', 'auto'); })
                    .call(zoom)
                    .on('dblclick.zoom', null)
                    .append('g');

                var sea = svg.append('rect')
                    .attr('class', 'sea')
                    .attr('fill', colors.sea)
                    .attr('opacity', '0.4')
                    .attr('width', bounds[1][0] - bounds[0][0])
                    .attr('height', bounds[1][1] - bounds[0][1])
                    .attr('transform', function(d) {
                        return 'translate(' + ((svg_width - d3.select(this).attr('width'))/2) + ', 0)';
                    })
                    .on('click', function() {
                        // Suppressed by "drag" event listener.
                        if (d3.event.defaultPrevented) return;

                        d3.select('.clicked')
                            .classed('clicked', false)
                            .transition()
                            .duration(TRANSITION_DURATION)
                            .attr('fill', colors.land);
                    })
                    .call(d3.behavior.drag());

                var initialTransition = true;
                svg.selectAll('.subunit')
                    .data(subunits.features)
                  .enter().append('path')
                    .attr('class', function(d) { return 'subunit ' + d.id; })
                    .attr('d', path)
                    .attr('fill', colors.land)
                    .attr('opacity', '0')
                    .on('mouseover', function(d) {
                        // Suppressed if the map is loading.
                        if (initialTransition) return;

                        var country = d3.select(this);

                        country.classed('mouseover', true);

                        if (svg.classed('dragged')) return;

                        d3.select(this)
                            .transition()
                            .duration(TRANSITION_DURATION)
                            .attr('fill', 'brown');

                        tooltip.style('display', 'block')
                            .select('.value')
                            .text(function() { return d.properties.name; });
                    })
                    .on('mouseout', function() {
                        // Suppressed if the map is loading.
                        if (initialTransition) return;

                        var country = d3.select(this);

                        country.classed('mouseover', false);

                        if (!country.classed('clicked') && !svg.classed('dragged')) {
                            country.transition()
                                .duration(TRANSITION_DURATION)
                                .attr('fill', colors.land);
                        }

                        tooltip.style('display', 'none');
                    })
                    .on('mousemove', function() {
                        var xPosition = d3.mouse(d3.select('body').node())[0] + 5;
                        var yPosition = d3.mouse(d3.select('body').node())[1] + 5;
                        tooltip.style('left', xPosition + 'px')
                            .style('top', yPosition + 'px');
                    })
                    .on('mouseup', function() {
                        // Suppressed if the map is loading.
                        if (initialTransition) return;

                        d3.select(this)
                            .transition()
                            .duration(TRANSITION_DURATION)
                            .attr('fill', 'brown');
                    })
                    .on('click', function(d) {
                        // Suppressed if the map is loading.
                        if (initialTransition) return;

                        // Suppressed by "drag" event listener.
                        if (d3.event.defaultPrevented) return;

                        const ZOOM_TRANSITION = 1000;
                        var country         = d3.select(this),
                            countryBounds   = path.bounds(d),
                            dx              = countryBounds[1][0] - countryBounds[0][0],
                            dy              = countryBounds[1][1] - countryBounds[0][1],
                            x               = (countryBounds[0][0] + countryBounds[1][0]) / 2,
                            y               = (countryBounds[0][1] + countryBounds[1][1]) / 2,
                            scale           = Math.max(1, Math.min(8, 0.9 / Math.max(dx / svg_width, dy / svg_height))),
                            translate       = [svg_width / 2 - scale * x, svg_height / 2 - scale * y];

                        if (country.classed('clicked')) {
                            country.classed('clicked', false)
                                .transition()
                                .duration(TRANSITION_DURATION)
                                .attr('fill', colors.land);

                            svg.transition()
                                .duration(ZOOM_TRANSITION)
                                .call(zoom.translate([0, 0]).scale(1).event);
                        } else {
                            d3.select('.clicked')
                                .classed('clicked', false)
                                .transition()
                                .duration(TRANSITION_DURATION)
                                .attr('fill', colors.land);

                            country.classed('clicked', true)
                                .transition()
                                .duration(TRANSITION_DURATION)
                                .attr('fill', 'brown');

                            svg.transition()
                                .duration(ZOOM_TRANSITION)
                                .call(zoom.translate(translate).scale(scale).event);
                        }
                    })
                    .call(d3.behavior.drag()
                        .on('dragstart', function() { svg.classed('dragged', true); })
                        .on('dragend', function() {
                            // Suppressed if the map is loading.
                            if (initialTransition) return;

                            svg.classed('dragged', false);

                            // Country we initially hovered on.
                            var country = d3.select(this);

                            // If we don't finish the dragging with hovering on that country.
                            if (!country.classed('mouseover')) {

                                // Make that country go gray if it is not clicked.
                                if (!country.classed('clicked')) {
                                    country.transition()
                                        .duration(TRANSITION_DURATION)
                                        .attr('fill', colors.land);
                                }

                                // Make the current country we hover on brown.
                                d3.select('.mouseover')
                                    .transition()
                                    .duration(TRANSITION_DURATION)
                                    .attr('fill', 'brown');
                            }
                        })
                    )
                  .transition()
                    .duration(300)
                    .ease('cube-in-out')
                    .delay(function(d, i) { return 30*(i/2%50); })
                    .attr('opacity', '1')
                    .call(endAll, function() { initialTransition = false; });

                // Borders.
                svg.append('path')
                    .datum(topojson.mesh(data, data.objects.subunits, function(a, b) { return a !== b; }))
                    .attr('class', 'subunit-boundary')
                    .attr('d', path)
                    .attr('stroke-width', border.width)
                    .attr('fill', 'none')
                    .attr('stroke', colors.border);

                window.addEventListener('resize', function resize() {
                    var percentage;
                    if (isNumber(css_width)) {
                        svg_width = css_width;
                    } else if (css_width.substr(css_width.length - 1) === '%') {
                        percentage = css_width.substr(0, css_width.length-1);
                        svg_width = window.innerWidth * percentage / 100;
                    }

                    if (isNumber(css_height)) {
                        svg_height = css_height;
                    } else if (css_height.substr(css_height.length - 1) === '%') {
                        percentage = css_height.substr(0, css_height.length-1);
                        svg_height = window.innerHeight * percentage / 100;
                    }

                    d3.select('svg')
                        .attr('width', svg_width)
                        .attr('height', svg_height);

                    projection = createProjection();
                    path = createPath(projection);

                    d3.selectAll('path').attr('d', path);

                    bounds = path.bounds(subunits);

                    sea.attr('width', bounds[1][0] - bounds[0][0])
                        .attr('height', bounds[1][1] - bounds[0][1])
                        .attr('transform', function(d) {
                            return 'translate(' + ((svg_width - d3.select(this).attr('width'))/2) + ', 0)';
                        });
                });
            });
        }

        my.dataPath = function(value) {
            if (!arguments.length) return dataPath;
            dataPath = value;
            return my;
        };

        my.width = function(value) {
            if (!arguments.length) return svg_width;

            css_width = value;

            if (isNumber(css_width)) {
                svg_width = css_width;
            } else if (css_width.substr(css_width.length - 1) === '%') {
                var percentage = css_width.substr(0, css_width.length-1);
                svg_width = window.innerWidth * percentage / 100;
            }

            return my;
        };

        my.height = function(value) {
            if (!arguments.length) return svg_height;

            css_height = value;

            if (isNumber(css_height)) {
                svg_height = css_height;
            } else if (css_height.substr(css_height.length - 1) === '%') {
                var percentage = css_height.substr(0, css_height.length-1);
                svg_height = window.innerHeight * percentage / 100;
            }

            return my;
        };

        my.colors = function(value) {
            if (!arguments.length) return colors;
            colors = value;
            return my;
        };

        my.border = function(value) {
            if (!arguments.length) return border;
            border = value;
            return my;
        };

        return my;
    };

    let map = d3.carte()
        .dataPath('data/geodata.json')
        .width('100%')
        .height('100%')
        .colors({
            sea: '#b8d0c5',
            land: '#333',
            border: '#ddd'
        })
        .border({ width: 1 });

        map('.map');
});
