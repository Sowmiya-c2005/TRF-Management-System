import {
  Card,
  CardContent,
  Typography,
  Grid
} from "@mui/material";
import { useEffect, useState } from "react";
import API from "../services/api";

function Dashboard() {

  const cards = [
    {
      title: "Total TRFs",
      value: stats.total_trfs
    },
    {
      title: "Documents",
      value: 2345
    },
    {
      title: "Active Projects",
      value: 58
    },
    {
      title: "Storage Used",
      value: "12 GB"
    }
  ];
  const [stats, setStats] = useState({
  total_trfs: 0
});

useEffect(() => {
  loadStats();
}, []);

const loadStats = async () => {

  const response = await API.get(
    "/dashboard-stats"
  );

  setStats(response.data);
};

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        TRF Management Dashboard
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid item xs={12} md={3} key={index}>
            <Card elevation={4}>
              <CardContent>
                <Typography variant="h6">
                  {card.title}
                </Typography>

                <Typography variant="h4">
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

export default Dashboard;