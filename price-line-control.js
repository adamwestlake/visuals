import BigNumber from 'https://cdn.jsdelivr.net/npm/bignumber.js@9.0.1/bignumber.mjs';

export class PriceLineControl {
    constructor(options = {}) {
        this.currentTickIdx = options.initialTickIdx || 0;
        this.tickLower = options.tickLower || 0;
        this.tickUpper = options.tickUpper || 0;
        this.onPriceChange = options.onPriceChange || (() => {});
        this.containerId = options.containerId || 'price-control';
        this.token0Decimals = options.token0Decimals || 18;
        this.token1Decimals = options.token1Decimals || 18;
        this.token0Symbol = options.token0Symbol || 'TKN0';
        this.token1Symbol = options.token1Symbol || 'TKN1';
        
        this.tickToPrice = (tick) => {
            // Use same base as Uniswap v3
            const base = new BigNumber('1.0001');
            const price = base.pow(tick);
            
            // Apply decimal adjustment
            const decimalAdjustment = new BigNumber(10).pow(this.token0Decimals - this.token1Decimals);
            return price.multipliedBy(decimalAdjustment);
        };

        this.priceToTick = (price) => {
            const base = 1.0001;
            // Remove decimal adjustment
            const decimalAdjustment = Math.pow(10, this.token0Decimals - this.token1Decimals);
            const rawPrice = price / decimalAdjustment;
            return Math.round(Math.log(rawPrice) / Math.log(base));
        };
        
        this.initialize();
    }

    initialize() {
        const container = document.createElement('div');
        container.id = this.containerId;
        container.style.marginBottom = '20px';
        container.className = 'price-control-container';

        // Create label with token symbols
        const label = document.createElement('div');
        label.style.marginBottom = '5px';
        label.textContent = `Price (${this.token1Symbol}/${this.token0Symbol})`;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = this.tickLower;
        slider.max = this.tickUpper;
        slider.value = this.currentTickIdx;
        slider.style.width = '80%';
        slider.style.marginRight = '10px';

        const input = document.createElement('input');
        input.type = 'number';
        const initialPrice = this.tickToPrice(this.currentTickIdx);
        input.value = initialPrice.toFixed(8);  // Show more decimals for precision
        input.style.width = '150px';  // Wider to accommodate more decimals
        input.step = 'any';

        slider.addEventListener('input', (e) => {
            const newTickValue = parseInt(e.target.value);
            const newPrice = this.tickToPrice(newTickValue);
            input.value = newPrice.toFixed(8);
            this.currentTickIdx = newTickValue;
            this.onPriceChange(newTickValue);
        });

        input.addEventListener('change', (e) => {
            try {
                const priceValue = parseFloat(e.target.value);
                if (priceValue <= 0) {
                    throw new Error('Price must be positive');
                }
                
                const newTickValue = this.priceToTick(priceValue);
                const constrainedTick = Math.min(Math.max(newTickValue, this.tickLower), this.tickUpper);
                
                slider.value = constrainedTick;
                this.currentTickIdx = constrainedTick;
                
                // Update input with the actual calculated price based on the tick
                const actualPrice = this.tickToPrice(constrainedTick);
                input.value = actualPrice.toFixed(8);
                
                this.onPriceChange(constrainedTick);
            } catch (error) {
                console.error('Invalid price input:', error);
                // Reset to current tick price
                const currentPrice = this.tickToPrice(this.currentTickIdx);
                input.value = currentPrice.toFixed(8);
            }
        });

        // Price display box to show current selection
        const priceDisplay = document.createElement('div');
        priceDisplay.style.marginTop = '5px';
        priceDisplay.style.fontSize = '12px';
        priceDisplay.textContent = `Current Tick: ${this.currentTickIdx}`;

        container.appendChild(label);
        container.appendChild(slider);
        container.appendChild(input);
        container.appendChild(priceDisplay);

        document.getElementById(this.containerId)?.remove();
        document.body.appendChild(container);
    }

    updateBounds(tickLower, tickUpper) {
        this.tickLower = tickLower;
        this.tickUpper = tickUpper;
        
        const slider = document.querySelector(`#${this.containerId} input[type="range"]`);
        if (slider) {
            slider.min = tickLower;
            slider.max = tickUpper;
        }
    }
}