package com.msj.spring.factorybean;

import com.msj.spring.entity.Architect;
import org.springframework.beans.factory.FactoryBean;

public class ArchitectFactoryBean implements FactoryBean<Architect> {

  private String architectInfo;

  @Override
  public Architect getObject() throws Exception {
        System.out.println("start new Architect");
        Architect architect = new Architect();
        String[] infos = architectInfo.split(",");
        architect.setAge(Integer.parseInt(infos[0]));
        architect.setGender("infos[1]");
        architect.setLevel("infos[2]");
        System.out.println(architect.toString());
        return architect;
  }

  @Override
  public Class<Architect> getObjectType() {
    return Architect.class;
  }

  @Override
  public boolean isSingleton() {
    return false;
  }

  public String getArchitectInfo() {
    return architectInfo;
  }

  public void setArchitectInfo(String architectInfo) {
    this.architectInfo = architectInfo;
  }
}
