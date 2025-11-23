let variablesTimelineSvg, varTimelineXScale, varTimelineYScale;
let visibleVariables = new Set(['acousticness', 'danceability', 'energy', 'valence', 'loudness']);

function createVariablesTimeline() {
    d3.select('#variables-timeline').selectAll('*').remove();
    
    const container = d3.select('#variables-timeline');
    const containerWidth = container.node().getBoundingClientRect().width;
    
    const margin = {top: 50, right: 180, bottom: 70, left: 80};
    const width = containerWidth - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    const svg = container
        .append('svg')
        .attr('width', '100%')
        .attr('height', height + margin.top + margin.bottom)
        .attr('viewBox', `0 0 ${containerWidth} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    
    variablesTimelineSvg = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Agrupar dados POR ANO
    const yearData = d3.rollups(
        appState.filteredData,
        v => ({
            acousticness: d3.mean(v, d => d.acousticness) * 100,
            danceability: d3.mean(v, d => d.danceability) * 100,
            energy: d3.mean(v, d => d.energy) * 100,
            valence: d3.mean(v, d => d.valence) * 100,
            loudness: ((d3.mean(v, d => d.loudness) + 60) / 60) * 100
        }),
        d => d.year
    ).sort((a, b) => a[0] - b[0]);
    
    // Cores mais contrastantes e vibrantes
    const variables = [
        {key: 'acousticness', name: 'Acousticness', color: '#E91E63', darkColor: '#C2185B'},
        {key: 'danceability', name: 'Danceability', color: '#00E5FF', darkColor: '#00B8D4'},
        {key: 'energy', name: 'Energy', color: '#76FF03', darkColor: '#64DD17'},
        {key: 'valence', name: 'Valence', color: '#FF6D00', darkColor: '#E65100'},
        {key: 'loudness', name: 'Loudness', color: '#AA00FF', darkColor: '#7B1FA2'}
    ];
    
    // Escalas
    varTimelineXScale = d3.scaleLinear()
        .domain([d3.min(yearData, d => d[0]), d3.max(yearData, d => d[0])])
        .range([0, width]);
    
    varTimelineYScale = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);
    
    // Grid horizontal mais visível
    variablesTimelineSvg.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.15)
        .call(d3.axisLeft(varTimelineYScale)
            .tickSize(-width)
            .tickFormat(''))
        .selectAll('line')
        .attr('stroke', '#444');
    
    // Área preenchida generator
    const area = d3.area()
        .x(d => varTimelineXScale(d.year))
        .y0(height)
        .y1(d => varTimelineYScale(d.value))
        .curve(d3.curveMonotoneX);
    
    // Line generator com curva suave
    const line = d3.line()
        .x(d => varTimelineXScale(d.year))
        .y(d => varTimelineYScale(d.value))
        .curve(d3.curveMonotoneX);
    
    // Desenhar áreas e linhas para cada variável
    variables.forEach(variable => {
        const lineData = yearData.map(d => ({
            year: d[0],
            value: d[1][variable.key]
        }));
        
        // Área preenchida (gradiente sutil)
        const gradient = variablesTimelineSvg.append('defs')
            .append('linearGradient')
            .attr('id', `gradient-${variable.key}`)
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');
        
        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', variable.color)
            .attr('stop-opacity', 0.3);
        
        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', variable.color)
            .attr('stop-opacity', 0.05);
        
        // Área
        variablesTimelineSvg.append('path')
            .datum(lineData)
            .attr('class', `variable-area variable-area-${variable.key}`)
            .attr('fill', `url(#gradient-${variable.key})`)
            .attr('d', area)
            .style('opacity', visibleVariables.has(variable.key) ? 1 : 0)
            .style('pointer-events', 'none');
        
        // Linha principal com sombra
        variablesTimelineSvg.append('path')
            .datum(lineData)
            .attr('class', `variable-line variable-line-${variable.key}`)
            .attr('fill', 'none')
            .attr('stroke', variable.color)
            .attr('stroke-width', 4)
            .attr('d', line)
            .style('opacity', visibleVariables.has(variable.key) ? 0.95 : 0)
            .style('filter', 'drop-shadow(0px 2px 4px rgba(0,0,0,0.4))')
            .on('mouseover', function() {
                if (!visibleVariables.has(variable.key)) return;
                d3.selectAll('.variable-line').style('opacity', 0.2);
                d3.selectAll('.variable-area').style('opacity', 0.1);
                d3.select(this).style('opacity', 1).attr('stroke-width', 6);
                d3.select(`.variable-area-${variable.key}`).style('opacity', 1);
            })
            .on('mouseout', function() {
                d3.selectAll('.variable-line').style('opacity', d => {
                    const key = d3.select(this).attr('class').match(/variable-line-(\w+)/);
                    return key && visibleVariables.has(key[1]) ? 0.95 : 0;
                });
                d3.selectAll('.variable-area').style('opacity', 1);
                d3.select(this).attr('stroke-width', 4);
            });
        
        // Pontos interativos em TODOS os anos
        variablesTimelineSvg.selectAll(`.point-${variable.key}`)
            .data(lineData)
            .enter()
            .append('circle')
            .attr('class', `point-${variable.key}`)
            .attr('cx', d => varTimelineXScale(d.year))
            .attr('cy', d => varTimelineYScale(d.value))
            .attr('r', 5)
            .attr('fill', variable.color)
            .attr('stroke', '#0a0a0a')
            .attr('stroke-width', 2.5)
            .style('opacity', 0)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .attr('r', 9)
                    .style('opacity', 1)
                    .attr('stroke-width', 3);
                
                d3.selectAll('.variable-line').style('opacity', 0.15);
                d3.selectAll('.variable-area').style('opacity', 0.1);
                d3.select(`.variable-line-${variable.key}`)
                    .style('opacity', 1)
                    .attr('stroke-width', 6);
                d3.select(`.variable-area-${variable.key}`).style('opacity', 1);
                
                const tooltip = d3.select('body')
                    .append('div')
                    .attr('class', 'tooltip')
                    .style('position', 'absolute')
                    .style('opacity', 1)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px')
                    .html(`
                        <strong style="color: ${variable.color}">${variable.name}</strong><br>
                        Year: <strong>${d.year}</strong><br>
                        Value: <strong>${d.value.toFixed(1)}%</strong>
                    `);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .attr('r', 5)
                    .style('opacity', 0)
                    .attr('stroke-width', 2.5);
                
                d3.selectAll('.variable-line').each(function() {
                    const className = d3.select(this).attr('class');
                    const match = className.match(/variable-line-(\w+)/);
                    if (match && visibleVariables.has(match[1])) {
                        d3.select(this).style('opacity', 0.95).attr('stroke-width', 4);
                    }
                });
                d3.selectAll('.variable-area').style('opacity', 1);
                
                d3.selectAll('.tooltip').remove();
            });
    });
    
    // Eixos com estilo melhorado
    const xAxis = d3.axisBottom(varTimelineXScale)
        .tickFormat(d3.format('d'))
        .ticks(15);
    
    variablesTimelineSvg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .selectAll('text')
        .style('font-size', '12px');
    
    variablesTimelineSvg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(varTimelineYScale).tickFormat(d => d + '%'))
        .selectAll('text')
        .style('font-size', '12px');
    
    // Labels
    variablesTimelineSvg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 50)
        .attr('fill', '#B3B3B3')
        .attr('text-anchor', 'middle')
        .style('font-size', '15px')
        .style('font-weight', '600')
        .text('Year');
    
    variablesTimelineSvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -55)
        .attr('fill', '#B3B3B3')
        .attr('text-anchor', 'middle')
        .style('font-size', '15px')
        .style('font-weight', '600')
        .text('Average Value (%)');
    
    // Legenda interativa
    const legend = variablesTimelineSvg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width + 25}, 20)`);
    
    variables.forEach((variable, i) => {
        const legendRow = legend.append('g')
            .attr('class', `legend-item legend-item-${variable.key}`)
            .attr('transform', `translate(0, ${i * 32})`)
            .style('cursor', 'pointer')
            .on('click', function() {
                // Toggle visibilidade
                if (visibleVariables.has(variable.key)) {
                    visibleVariables.delete(variable.key);
                } else {
                    visibleVariables.add(variable.key);
                }
                
                const isVisible = visibleVariables.has(variable.key);
                
                // Atualizar linha e área
                d3.select(`.variable-line-${variable.key}`)
                    .transition()
                    .duration(300)
                    .style('opacity', isVisible ? 0.95 : 0);
                
                d3.select(`.variable-area-${variable.key}`)
                    .transition()
                    .duration(300)
                    .style('opacity', isVisible ? 1 : 0);
                
                // Atualizar legenda
                d3.select(this).select('rect')
                    .transition()
                    .duration(200)
                    .attr('fill', isVisible ? variable.color : '#333');
                
                d3.select(this).select('text')
                    .transition()
                    .duration(200)
                    .attr('fill', isVisible ? '#EDEDED' : '#666')
                    .style('text-decoration', isVisible ? 'none' : 'line-through');
            })
            .on('mouseover', function() {
                if (visibleVariables.has(variable.key)) {
                    d3.select(this).select('rect')
                        .attr('stroke', variable.color)
                        .attr('stroke-width', 2);
                }
            })
            .on('mouseout', function() {
                d3.select(this).select('rect')
                    .attr('stroke', 'none');
            });
        
        // Quadrado colorido
        legendRow.append('rect')
            .attr('width', 18)
            .attr('height', 18)
            .attr('rx', 3)
            .attr('fill', variable.color)
            .attr('stroke', 'none');
        
        // Texto
        legendRow.append('text')
            .attr('x', 25)
            .attr('y', 13)
            .attr('fill', '#EDEDED')
            .style('font-size', '14px')
            .style('font-weight', '500')
            .text(variable.name);
    });
    
    // Adicionar título à legenda
    legend.append('text')
        .attr('x', 0)
        .attr('y', -10)
        .attr('fill', '#1DB954')
        .style('font-size', '13px')
        .style('font-weight', '700')
        .text('Click to toggle:');
}

function updateVariablesTimeline() {
    createVariablesTimeline();
}
