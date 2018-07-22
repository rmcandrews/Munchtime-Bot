module.exports = `
<html>
<head>
    <title>Scoreboard</title>
    <style>
        table {
            font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
            border-collapse: collapse;
            width: 100%;
        }
        
        table td, table th {
            border: 1px solid #ddd;
            padding: 8px;
        }
        
        table tr:nth-child(even){background-color: #f2f2f2;}
        
        table tr:hover {background-color: #ddd;}
        
        table th {
            padding-top: 12px;
            padding-bottom: 12px;
            text-align: left;
            background-color: rgb(86, 76, 175);
            color: white;
        }
    </style>
</head>
<body bgcolor=white>

<table border="0" cellpadding="10">
    <tr>
        <th>Name</th>
        <th>Bans</th>
        <th>Time</th>
        <th>Tacos Given</th>
        <th>Tacos Received</th>
    </tr>
    {{{tableData}}}</table>
</body>
</html>
`