package com.questionnaire.model;

public class SleepParameters {
    private double SOL; // Sleep Onset Latency (minutter)
    private double WASO; // Wake After Sleep Onset (minutter)
    private double TIB; // Time in Bed (minutter)
    private double TST; // Total Sleep Time (minutter)

    public SleepParameters() {}

    public SleepParameters(double SOL, double WASO, double TIB, double TST) {
        this.SOL = SOL;
        this.WASO = WASO;
        this.TIB = TIB;
        this.TST = TST;
    }

    // Getters and Setters
    public double getSOL() {
        return SOL;
    }

    public void setSOL(double SOL) {
        this.SOL = SOL;
    }

    public double getWASO() {
        return WASO;
    }

    public void setWASO(double WASO) {
        this.WASO = WASO;
    }

    public double getTIB() {
        return TIB;
    }

    public void setTIB(double TIB) {
        this.TIB = TIB;
    }

    public double getTST() {
        return TST;
    }

    public void setTST(double TST) {
        this.TST = TST;
    }
}










