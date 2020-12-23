package com.msj.spring.entity;

public class Architect {


    static {
        System.out.println("1111111");
    }


    /**
     * 级别
     */
    private String level;

    private int age;

    private String gender;

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    @Override
    public String toString() {
        return "Architect{" +
                "level=" + level +
                ", age='" + age + '\'' +
                ", gender=" + gender +
                '}';
    }
}
