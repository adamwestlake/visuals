<script type ="module" src="graph.js"></script>
    <script type="module">
        import { plotLiquidityChart } from './graph.js';
    
        // Call the function with the desired pool address
        plotLiquidityChart('0x1d42064fc4beb5f8aaf85f4617ae8b3b5b8bd801')
          .catch(error => {
            console.error('An error occurred while plotting the chart:', error);
          });
      </script>