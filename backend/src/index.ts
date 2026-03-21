import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runMigrations } from './migrate';
import registerRoutes from './modules/auth/register/register.routes';
import loginRoutes from './modules/auth/login/login.routes';
import campaignRoutes from './modules/campaign/campaign.routes';
import campaignsRoutes from './modules/campaigns/campaigns.routes';
import metaRoutes from './modules/meta/meta.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/auth/register', registerRoutes);
app.use('/auth/login', loginRoutes);
app.use('/campaign', campaignRoutes);
app.use('/campaigns', campaignsRoutes);
app.use('/meta', metaRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'GrowthAi API running!' });
});

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
