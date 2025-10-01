<script lang="ts">
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    
    $effect(() => {
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
    
        ctx = canvas.getContext("2d")!;
        draw();
    });

    let offsetX = 0;
    let offsetY = 0;
    let scale = 1;
    let isDragging = false;
    let startX: number, startY: number;
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
        ctx.scale(scale, scale);

        ctx.strokeStyle = "gray";
        ctx.lineWidth = 1 / scale;

        // temporary grid
        const gridSize = 24;
        const canvasSize = 300000;

        for (let x = -canvasSize / 2; x < canvasSize / 2; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, -canvasSize / 2);
            ctx.lineTo(x, canvasSize / 2);
            ctx.stroke();
        }

        for (let y = -canvasSize / 2; y < canvasSize / 2; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(-canvasSize / 2, y);
            ctx.lineTo(canvasSize / 2, y);
            ctx.stroke();
        }

        // temporary sun
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // pan events
    function mousedown (event: MouseEvent) {
        isDragging = true;
        startX = event.clientX - offsetX;
        startY = event.clientY - offsetY;
    }

    function mouseup () {
        isDragging = false;
    }

    function mouseleave () {
        isDragging = false;
    }

    function mousemove (event: MouseEvent) {
        if (isDragging) {
            offsetX = event.clientX - startX;
            offsetY = event.clientY - startY;
            draw();
        }
    }

    const zoomMax = 10;
    const zoomMin = 0.1;

    // zoom events
    function wheel (event: WheelEvent) {
        event.preventDefault();

        const zoomSpeed = 0.1;
        const oldScale = scale;

        scale *= event.deltaY > 0 ? (1 - zoomSpeed) : (1 + zoomSpeed);
        scale = Math.max(zoomMin, Math.min(scale, zoomMax)); // limit zoom
        
        // keep zoom on the cursor
        const cursorX = event.clientX - canvas.width / 2;
        const cursorY = event.clientY - canvas.height / 2;

        offsetX = cursorX - (cursorX - offsetX) * (scale / oldScale);
        offsetY = cursorY - (cursorY - offsetY) * (scale / oldScale);
        
        draw();
    }

    // resize canvas
    function resize () {
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
        draw();
    }
</script>

<canvas class="border border-gray-600" bind:this={canvas}
    onmousedown={mousedown}
    onmouseup={mouseup}
    onmousemove={mousemove}
    onmouseleave={mouseleave}
    onwheel={wheel}
    onresize={resize}
></canvas>
