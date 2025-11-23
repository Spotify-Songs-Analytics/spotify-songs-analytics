let timelineSvg, timelineXScale, timelineYScale;
let visibleGenres = new Set();

function createTimeline() {
    const margin = {top: 60, right: 200, bottom: 70, left: 70};
    const width = 1200 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Limpar gráfico anterior
    d3.select('#timeline').selectAll('*').remove();
    
    // Criar SVG principal
    const svg = d3.select('#timeline')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);
    
    // Grupo principal
    timelineSvg = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Agregar dados por ano e género
    const yearGenreData = d3.rollup(
        appState.filteredData,
        v => v.length,
        d => d.year,
        d => d.genre
    );
    
    // Obter top 8 géneros
    const genreTotals = d3.rollup(
        appState.filteredData,
        v => v.length,
        d => d.genre
    );
    
    const topGenres = Array.from(genreTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(d => d[0]);
    
    console.log('📊 Top genres:', topGenres);
    
    // Inicializar todos os géneros como visíveis
    visibleGenres = new Set(topGenres);
    
    // Preparar dados por género (não empilhados!)
    const years = Array.from(yearGenreData.keys()).sort((a, b) => a - b);
    
    const genreData = topGenres.map(genre => ({
        genre: genre,
        values: years.map(year => {
            const yearData = yearGenreData.get(year) || new Map();
            return {
                year: year,
                count: yearData.get(genre) || 0
            };
        })
    }));
    
    console.log('📈 Genre line data:', genreData);
    
    // Escalas
    timelineXScale = d3.scaleLinear()
        .domain(d3.extent(years))
        .range([0, width]);
    
    const maxCount = d3.max(genreData, g => d3.max(g.values, v => v.count));
    
    timelineYScale = d3.scaleLinear()
        .domain([0, maxCount * 1.1])
        .range([height, 0]);
    
    // Fundo escuro
    timelineSvg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', '#1A1A1A')
        .attr('opacity', 0.3);
    
    // Grid horizontal
    timelineSvg.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.15)
        .call(d3.axisLeft(timelineYScale)
            .tickSize(-width)
            .tickFormat(''))
        .selectAll('line')
        .style('stroke', '#444');
    
    // Eixo X
    timelineSvg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(timelineXScale)
            .tickFormat(d3.format('d'))
            .ticks(12))
        .selectAll('text')
        .style('fill', '#B3B3B3')
        .style('font-size', '13px');
    
    // Eixo Y
    timelineSvg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(timelineYScale)
            .ticks(10))
        .selectAll('text')
        .style('fill', '#B3B3B3')
        .style('font-size', '13px');
    
    // Labels dos eixos
    timelineSvg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 50)
        .attr('fill', '#EDEDED')
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', '600')
        .text('Year');
    
    timelineSvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -50)
        .attr('fill', '#EDEDED')
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', '600')
        .text('Number of Songs');
    
    // Gerador de linhas
    const line = d3.line()
        .x(d => timelineXScale(d.year))
        .y(d => timelineYScale(d.count))
        .curve(d3.curveMonotoneX);
    
    // Desenhar LINHAS para cada género
    genreData.forEach((g, index) => {
        const color = getGenreColor(g.genre);
        
        // Linha
        const path = timelineSvg.append('path')
            .datum(g.values)
            .attr('class', `genre-line line-${index}`)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 3)
            .attr('d', line)
            .style('opacity', visibleGenres.has(g.genre) ? 0.85 : 0)
            .style('cursor', 'pointer');
        
        // Animação de entrada
        const totalLength = path.node().getTotalLength();
        path
            .attr('stroke-dasharray', totalLength + ' ' + totalLength)
            .attr('stroke-dashoffset', totalLength)
            .transition()
            .duration(1200)
            .delay(index * 80)
            .attr('stroke-dashoffset', 0);
        
        // Pontos interativos (invisíveis por defeito)
        const points = timelineSvg.selectAll(`.point-${index}`)
            .data(g.values)
            .enter()
            .append('circle')
            .attr('class', `point-${index}`)
            .attr('cx', d => timelineXScale(d.year))
            .attr('cy', d => timelineYScale(d.count))
            .attr('r', 4)
            .attr('fill', color)
            .attr('stroke', '#1A1A1A')
            .attr('stroke-width', 2)
            .style('opacity', 0)
            .style('cursor', 'pointer');
        
        // Hover na linha
        path.on('mouseover', function() {
            if (!visibleGenres.has(g.genre)) return;
            
            d3.select(this)
                .attr('stroke-width', 5)
                .style('opacity', 1);
            
            d3.selectAll('.genre-line').style('opacity', 0.2);
            d3.select(this).style('opacity', 1);
            
            timelineSvg.selectAll(`.point-${index}`)
                .style('opacity', 1);
            
            d3.select(`.legend-item-${g.genre.replace(/\s+/g, '-')}`)
                .select('text')
                .style('font-weight', 'bold');
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('stroke-width', 3);
            
            d3.selectAll('.genre-line').each(function(d, idx) {
                const genreName = topGenres[idx];
                if (visibleGenres.has(genreName)) {
                    d3.select(this).style('opacity', 0.85);
                } else {
                    d3.select(this).style('opacity', 0);
                }
            });
            
            timelineSvg.selectAll(`.point-${index}`)
                .style('opacity', 0);
            
            d3.selectAll('.legend-item text')
                .style('font-weight', '500');
            
            d3.selectAll('.timeline-tooltip').remove();
        });
        
        // Hover nos pontos
        points.on('mouseover', function(event, d) {
            if (!visibleGenres.has(g.genre)) return;
            
            d3.select(this)
                .style('opacity', 1)
                .attr('r', 6);
            
            // Mostrar todos os pontos da linha
            timelineSvg.selectAll(`.point-${index}`)
                .style('opacity', 1);
            
            d3.selectAll('.timeline-tooltip').remove();
            
            d3.select('body').append('div')
                .attr('class', 'timeline-tooltip')
                .style('position', 'absolute')
                .style('background', '#1A1A1A')
                .style('color', '#EDEDED')
                .style('padding', '12px 16px')
                .style('border', `2px solid ${color}`)
                .style('border-radius', '8px')
                .style('pointer-events', 'none')
                .style('font-size', '13px')
                .style('box-shadow', '0 6px 16px rgba(0,0,0,0.7)')
                .style('z-index', 1000)
                .html(`
                    <div style="font-weight: bold; color: ${color}; margin-bottom: 6px; font-size: 14px;">${g.genre}</div>
                    <div><strong>Year:</strong> ${d.year}</div>
                    <div><strong>Songs:</strong> ${d.count}</div>
                `)
                .style('left', (event.pageX + 15) + 'px')
                .style('top', (event.pageY - 15) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this)
                .style('opacity', 0)
                .attr('r', 4);
            
            d3.selectAll('.timeline-tooltip').remove();
        });
    });
    
    // Legenda com toggle
    const legend = timelineSvg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width + 20}, ${height / 2 - (topGenres.length * 25) / 2})`);
    
    legend.append('text')
        .attr('x', 0)
        .attr('y', -15)
        .attr('fill', '#1DB954')
        .style('font-size', '13px')
        .style('font-weight', 'bold')
        .text('Click to toggle:');
    
    topGenres.forEach((genre, i) => {
        const genreId = genre.replace(/\s+/g, '-');
        
        const legendRow = legend.append('g')
            .attr('class', `legend-item legend-item-${genreId}`)
            .attr('transform', `translate(0, ${i * 25})`)
            .style('cursor', 'pointer')
            .on('click', function() {
                // Toggle visibilidade
                if (visibleGenres.has(genre)) {
                    visibleGenres.delete(genre);
                } else {
                    visibleGenres.add(genre);
                }
                
                const isVisible = visibleGenres.has(genre);
                
                // Animar linha
                d3.select(`.line-${i}`)
                    .transition().duration(300)
                    .style('opacity', isVisible ? 0.85 : 0);
                
                // Esconder pontos se invisível
                if (!isVisible) {
                    timelineSvg.selectAll(`.point-${i}`)
                        .style('opacity', 0);
                }
                
                // Atualizar visual da legenda
                d3.select(this).select('line')
                    .transition().duration(200)
                    .attr('stroke', isVisible ? getGenreColor(genre) : '#333')
                    .attr('stroke-width', isVisible ? 3 : 2);
                
                d3.select(this).select('text')
                    .transition().duration(200)
                    .attr('fill', isVisible ? '#EDEDED' : '#666')
                    .style('text-decoration', isVisible ? 'none' : 'line-through');
            })
            .on('mouseover', function() {
                if (!visibleGenres.has(genre)) return;
                
                d3.select(`.line-${i}`)
                    .attr('stroke-width', 5)
                    .style('opacity', 1);
                
                d3.selectAll('.genre-line').style('opacity', 0.2);
                d3.select(`.line-${i}`).style('opacity', 1);
                
                timelineSvg.selectAll(`.point-${i}`)
                    .style('opacity', 1);
                
                d3.select(this).select('text')
                    .style('font-weight', 'bold');
            })
            .on('mouseout', function() {
                d3.selectAll('.genre-line')
                    .attr('stroke-width', 3)
                    .each(function(d, idx) {
                        const genreName = topGenres[idx];
                        d3.select(this).style('opacity', visibleGenres.has(genreName) ? 0.85 : 0);
                    });
                
                timelineSvg.selectAll(`.point-${i}`)
                    .style('opacity', 0);
                
                d3.select(this).select('text')
                    .style('font-weight', '500');
            });
        
        // Linha da legenda
        legendRow.append('line')
            .attr('x1', 0)
            .attr('x2', 25)
            .attr('y1', 9)
            .attr('y2', 9)
            .attr('stroke', getGenreColor(genre))
            .attr('stroke-width', 3);
        
        // Texto
        legendRow.append('text')
            .attr('x', 30)
            .attr('y', 13)
            .attr('fill', '#EDEDED')
            .style('font-size', '13px')
            .style('font-weight', '500')
            .text(genre);
    });
    
    // Título principal
    svg.append('text')
        .attr('x', margin.left)
        .attr('y', 30)
        .attr('fill', '#EDEDED')
        .style('font-size', '20px')
        .style('font-weight', 'bold')
        .text('Genre Evolution Over Time');
}

function updateTimeline() {
    createTimeline();
}
