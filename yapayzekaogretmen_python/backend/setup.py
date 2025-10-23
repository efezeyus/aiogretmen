"""
Yapay Zeka Öğretmen - Setup Script
---------------------------------
Projeyi kurma ve dağıtım için kurulum betiği.
"""
from setuptools import setup, find_packages

# Bağımlılıkları requirements.txt'den okuma
with open('requirements.txt') as f:
    required = f.read().splitlines()

setup(
    name="yapay_zeka_ogretmen",
    version="0.1.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=required,
    python_requires=">=3.9",
    author="Yapay Zeka Öğretmen Ekibi",
    author_email="info@yapayzekaogretmen.com",
    description="MEB müfredatına uygun yapay zeka destekli kişiselleştirilmiş eğitim platformu",
    keywords="education, ai, yapay, zeka, eğitim, öğretmen",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Education",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
) 