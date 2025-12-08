package com.questionnaire.model;

/**
 * Value object til at holde rå data fra answers map før beregning af søvnparametre
 */
public class SleepData {
    private String wentToBedTime;
    private String lightOffTime;
    private String fellAsleepAfter;
    private double WASO;
    private String wokeUpTime;
    private String gotUpTime;

    public SleepData() {
        this.WASO = 0.0;
    }

    public SleepData(String wentToBedTime, String lightOffTime, String fellAsleepAfter, 
                     double WASO, String wokeUpTime, String gotUpTime) {
        this.wentToBedTime = wentToBedTime;
        this.lightOffTime = lightOffTime;
        this.fellAsleepAfter = fellAsleepAfter;
        this.WASO = WASO;
        this.wokeUpTime = wokeUpTime;
        this.gotUpTime = gotUpTime;
    }

    public String getWentToBedTime() {
        return wentToBedTime;
    }

    public void setWentToBedTime(String wentToBedTime) {
        this.wentToBedTime = wentToBedTime;
    }

    public String getLightOffTime() {
        return lightOffTime;
    }

    public void setLightOffTime(String lightOffTime) {
        this.lightOffTime = lightOffTime;
    }

    public String getFellAsleepAfter() {
        return fellAsleepAfter;
    }

    public void setFellAsleepAfter(String fellAsleepAfter) {
        this.fellAsleepAfter = fellAsleepAfter;
    }

    public double getWASO() {
        return WASO;
    }

    public void setWASO(double WASO) {
        this.WASO = WASO;
    }

    public String getWokeUpTime() {
        return wokeUpTime;
    }

    public void setWokeUpTime(String wokeUpTime) {
        this.wokeUpTime = wokeUpTime;
    }

    public String getGotUpTime() {
        return gotUpTime;
    }

    public void setGotUpTime(String gotUpTime) {
        this.gotUpTime = gotUpTime;
    }

    /**
     * Tjekker om alle nødvendige værdier er sat for at kunne beregne søvnparametre
     * Minimum krav: wentToBedTime og gotUpTime skal være sat
     */
    public boolean isValid() {
        return wentToBedTime != null && !wentToBedTime.trim().isEmpty() &&
               gotUpTime != null && !gotUpTime.trim().isEmpty();
    }
}




